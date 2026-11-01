import asyncio
import random
import time
import uuid
from datetime import datetime, timezone
from collections import defaultdict

import networkx as nx
import numpy as np
import pandas as pd

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)


# =========================================================
# FRAUDSHIELD AI — VERSION 4
# Synthetic real-time payment fraud demonstration
# =========================================================

app = FastAPI(
    title="FraudShield AI",
    description="AI-powered digital payment fraud detection prototype",
    version="4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# GLOBAL DATA
# =========================================================

transactions = []
alerts = []
network_graph = nx.DiGraph()

model = None
model_metrics = {}

stream_task = None

stream_state = {
    "running": False,
    "generated_count": 0,
    "last_generated": None
}

drift_state = {
    "active": False,
    "message": "No simulated drift currently active",
    "baseline_average_amount": 0,
    "current_average_amount": 0
}

fairness_state = {
    "status": "DEMONSTRATION",
    "message": "Uses synthetic segments only"
}

MAX_TRANSACTIONS = 500


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def current_time():
    return datetime.now(timezone.utc).isoformat()


def generate_account():
    return f"ACC{random.randint(1001, 1099)}"


def add_transaction_to_storage(transaction):
    transactions.insert(0, transaction)

    if len(transactions) > MAX_TRANSACTIONS:
        transactions.pop()

    sender = transaction["sender"]
    receiver = transaction["receiver"]

    network_graph.add_edge(
        sender,
        receiver,
        amount=transaction["amount"],
        transaction_id=transaction["id"]
    )


def create_alert(transaction, alert_type=None):
    alert = {
        "id": str(uuid.uuid4())[:8],
        "transaction_id": transaction["id"],
        "type": alert_type or transaction["status"],
        "sender": transaction["sender"],
        "receiver": transaction["receiver"],
        "amount": transaction["amount"],
        "risk_score": transaction["risk_score"],
        "reason": transaction["reasons"],
        "timestamp": current_time()
    }

    alerts.insert(0, alert)

    if len(alerts) > 200:
        alerts.pop()

    return alert


# =========================================================
# MACHINE LEARNING MODEL
# =========================================================

def train_model():

    global model, model_metrics

    rng = np.random.default_rng(42)

    sample_count = 12000

    amount = rng.lognormal(
        mean=7.5,
        sigma=1.2,
        size=sample_count
    )

    account_age = rng.integers(
        1,
        1500,
        sample_count
    )

    transaction_frequency = rng.integers(
        1,
        80,
        sample_count
    )

    recipient_risk = rng.random(sample_count)

    unusual_hour = rng.integers(
        0,
        2,
        sample_count
    )

    new_device = rng.integers(
        0,
        2,
        sample_count
    )

    risk_signal = (
        (amount > 30000) * 2.0
        + (account_age < 30) * 1.5
        + (transaction_frequency > 45) * 1.2
        + (recipient_risk > 0.7) * 2.0
        + unusual_hour * 0.8
        + new_device * 1.0
        + rng.normal(0, 1, sample_count)
    )

    labels = (
        risk_signal > 3.4
    ).astype(int)

    X = pd.DataFrame({
        "amount": amount,
        "account_age": account_age,
        "transaction_frequency": transaction_frequency,
        "recipient_risk": recipient_risk,
        "unusual_hour": unusual_hour,
        "new_device": new_device
    })

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        labels,
        test_size=0.25,
        random_state=42,
        stratify=labels
    )

    model = RandomForestClassifier(
        n_estimators=120,
        max_depth=12,
        class_weight="balanced",
        random_state=42
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    model_metrics = {
        "accuracy": round(
            accuracy_score(y_test, predictions) * 100, 2
        ),
        "precision": round(
            precision_score(y_test, predictions, zero_division=0) * 100, 2
        ),
        "recall": round(
            recall_score(y_test, predictions, zero_division=0) * 100, 2
        ),
        "f1_score": round(
            f1_score(y_test, predictions, zero_division=0) * 100, 2
        ),
        "confusion_matrix": confusion_matrix(
            y_test,
            predictions
        ).tolist(),
        "training_samples": int(len(X_train)),
        "testing_samples": int(len(X_test)),
        "fraud_samples": int(labels.sum()),
        "normal_samples": int(len(labels) - labels.sum()),
        "data_type": "SYNTHETIC TRAINING DATA"
    }


# =========================================================
# TRANSACTION GENERATION
# =========================================================

def generate_transaction(
    sender=None,
    receiver=None,
    amount=None,
    demo_type="NORMAL"
):

    sender = sender or generate_account()
    receiver = receiver or generate_account()

    while sender == receiver:
        receiver = generate_account()

    amount = amount if amount is not None else random.choice([
        250, 500, 1200, 2500, 5000,
        8000, 15000, 22000, 45000, 60000
    ])

    account_age = random.randint(1, 1500)
    transaction_frequency = random.randint(1, 80)
    recipient_risk = random.random()
    unusual_hour = random.randint(0, 1)
    new_device = random.randint(0, 1)

    features = pd.DataFrame([{
        "amount": amount,
        "account_age": account_age,
        "transaction_frequency": transaction_frequency,
        "recipient_risk": recipient_risk,
        "unusual_hour": unusual_hour,
        "new_device": new_device
    }])

    started = time.perf_counter()

    fraud_probability = float(
        model.predict_proba(features)[0][1]
    )

    prediction_latency = (
        time.perf_counter() - started
    ) * 1000

    rule_score = 5
    reasons = []

    if amount > 30000:
        rule_score += 35
        reasons.append("Unusually high transaction amount")

    if amount > 50000:
        rule_score += 15
        reasons.append("Very large payment")

    if account_age < 30:
        rule_score += 15
        reasons.append("Recently created account")

    if transaction_frequency > 45:
        rule_score += 15
        reasons.append("High transaction frequency")

    if recipient_risk > 0.7:
        rule_score += 15
        reasons.append("High-risk recipient pattern")

    if unusual_hour:
        rule_score += 5
        reasons.append("Unusual transaction hour")

    if new_device:
        rule_score += 5
        reasons.append("New device pattern")

    rule_score = min(rule_score, 100)

    hybrid_score = (
        fraud_probability * 65
        + rule_score * 0.35
    )

    risk_score = round(min(hybrid_score, 100), 2)

    status = (
        "HIGH RISK" if risk_score >= 70
        else "REVIEW" if risk_score >= 35
        else "NORMAL"
    )

    if not reasons:
        reasons.append("No major suspicious indicators detected")

    transaction = {
        "id": str(uuid.uuid4())[:10],
        "sender": sender,
        "receiver": receiver,
        "amount": float(amount),
        "risk_score": risk_score,
        "ai_probability": round(fraud_probability * 100, 2),
        "rule_score": rule_score,
        "status": status,
        "reasons": reasons,
        "timestamp": current_time(),
        "prediction_latency_ms": round(prediction_latency, 3),
        "account_age_days": account_age,
        "transaction_frequency": transaction_frequency,
        "recipient_risk": round(recipient_risk, 3),
        "unusual_hour": unusual_hour,
        "new_device": new_device,
        "data_type": "SYNTHETIC DEMONSTRATION",
        "demo_type": demo_type,
        "mule_ring": False
    }

    return transaction


# =========================================================
# MULE-RING DETECTION
# =========================================================

def detect_mule_rings():

    graph = nx.DiGraph()

    for transaction in transactions:
        graph.add_edge(
            transaction["sender"],
            transaction["receiver"]
        )

    detected_rings = []

    try:
        cycles = list(
            nx.simple_cycles(graph)
        )
    except Exception:
        cycles = []

    for cycle in cycles:

        if len(cycle) < 3 or len(cycle) > 8:
            continue

        ring_accounts = set(cycle)

        ring_transactions = [
            transaction
            for transaction in transactions
            if transaction["sender"] in ring_accounts
            and transaction["receiver"] in ring_accounts
        ]

        ring_details = {
            "id": "RING-" + "-".join(cycle),
            "accounts": list(cycle),
            "account_count": len(cycle),
            "transaction_count": len(ring_transactions),
            "total_amount": round(
                sum(t["amount"] for t in ring_transactions), 2
            ),
            "risk_level": "HIGH",
            "reason": "Circular transfer pattern detected between connected accounts"
        }

        detected_rings.append(ring_details)

    return detected_rings


# =========================================================
# SYNTHETIC MULE-RING DEMONSTRATION
# =========================================================

def create_mule_ring_demo():

    ring_accounts = [
        "MULE1001",
        "MULE1002",
        "MULE1003",
        "MULE1004"
    ]

    ring_transactions = []

    transfers = [
        (ring_accounts[0], ring_accounts[1], 42000),
        (ring_accounts[1], ring_accounts[2], 39000),
        (ring_accounts[2], ring_accounts[3], 37000),
        (ring_accounts[3], ring_accounts[0], 35000)
    ]

    for sender, receiver, amount in transfers:

        transaction = generate_transaction(
            sender=sender,
            receiver=receiver,
            amount=amount,
            demo_type="PLANTED MULE RING"
        )

        transaction["mule_ring"] = True
        transaction["status"] = "HIGH RISK"
        transaction["risk_score"] = max(
            transaction["risk_score"], 90
        )

        transaction["reasons"].append(
            "Account belongs to a planted circular transfer demonstration"
        )

        add_transaction_to_storage(transaction)

        create_alert(
            transaction,
            "MULE RING SUSPICION"
        )

        ring_transactions.append(transaction)

    return {
        "message": "Synthetic mule-ring demonstration generated",
        "accounts": ring_accounts,
        "transactions_created": len(ring_transactions),
        "transactions": ring_transactions,
        "data_type": "SYNTHETIC DEMONSTRATION"
    }


# =========================================================
# LIVE STREAM
# =========================================================

async def transaction_stream():

    stream_state["running"] = True

    try:
        while stream_state["running"]:

            transaction = generate_transaction()

            add_transaction_to_storage(transaction)

            if transaction["status"] != "NORMAL":
                create_alert(transaction)

            stream_state["generated_count"] += 1
            stream_state["last_generated"] = current_time()

            await asyncio.sleep(3)

    except asyncio.CancelledError:
        pass

    finally:
        stream_state["running"] = False


# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
async def startup_event():

    print("=" * 55)
    print("FRAUDSHIELD AI V4")
    print("Starting synthetic fraud detection system")
    print("=" * 55)

    train_model()

    print("Machine learning model trained")

    for _ in range(30):

        transaction = generate_transaction()

        add_transaction_to_storage(transaction)

        if transaction["status"] != "NORMAL":
            create_alert(transaction)

    print("Initial synthetic transactions generated")
    print("FraudShield AI V4 is ready")
    print("=" * 55)


# =========================================================
# BASIC ENDPOINTS
# =========================================================

@app.get("/")
def home():

    return {
        "project": "FraudShield AI",
        "version": "4.0",
        "status": "running",
        "description": "Synthetic real-time payment fraud detection prototype"
    }


@app.get("/api/transactions")
def get_transactions():

    return {
        "count": len(transactions),
        "transactions": transactions
    }


@app.get("/api/alerts")
def get_alerts():

    return {
        "count": len(alerts),
        "alerts": alerts
    }


@app.get("/api/stats")
def get_stats():

    high_risk = sum(
        1 for t in transactions
        if t["status"] == "HIGH RISK"
    )

    review = sum(
        1 for t in transactions
        if t["status"] == "REVIEW"
    )

    normal = sum(
        1 for t in transactions
        if t["status"] == "NORMAL"
    )

    total_amount = sum(
        t["amount"] for t in transactions
    )

    average_latency = (
        sum(t["prediction_latency_ms"] for t in transactions)
        / len(transactions)
        if transactions else 0
    )

    return {
        "total_transactions": len(transactions),
        "high_risk": high_risk,
        "review": review,
        "normal": normal,
        "total_amount": round(total_amount, 2),
        "average_latency_ms": round(average_latency, 3),
        "alerts": len(alerts),
        "stream_running": stream_state["running"],
        "mule_rings": len(detect_mule_rings())
    }


@app.post("/api/simulate")
def simulate_transaction():

    transaction = generate_transaction()

    add_transaction_to_storage(transaction)

    if transaction["status"] != "NORMAL":
        create_alert(transaction)

    return transaction


@app.get("/api/transactions/{transaction_id}")
def get_transaction(transaction_id: str):

    for transaction in transactions:
        if transaction["id"] == transaction_id:
            return transaction

    return {
        "error": "Transaction not found"
    }


# =========================================================
# STREAM CONTROL
# =========================================================

@app.post("/api/stream/start")
async def start_stream():

    global stream_task

    if stream_task is not None and not stream_task.done():
        return {
            "message": "Stream is already running",
            "running": True
        }

    stream_state["running"] = True

    stream_task = asyncio.create_task(
        transaction_stream()
    )

    return {
        "message": "Live transaction stream started",
        "running": True
    }


@app.post("/api/stream/stop")
async def stop_stream():

    global stream_task

    stream_state["running"] = False

    if stream_task is not None:
        stream_task.cancel()
        stream_task = None

    return {
        "message": "Live transaction stream stopped",
        "running": False
    }


@app.get("/api/stream/status")
def stream_status():

    return stream_state


# =========================================================
# NETWORK AND MULE-RING ENDPOINTS
# =========================================================

@app.get("/api/network")
def get_network():

    nodes = []
    edges = []

    for node in network_graph.nodes():

        nodes.append({
            "id": node,
            "connections": (
                network_graph.in_degree(node)
                + network_graph.out_degree(node)
            )
        })

    for sender, receiver, data in network_graph.edges(data=True):

        edges.append({
            "source": sender,
            "target": receiver,
            "amount": data.get("amount", 0)
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "node_count": len(nodes),
        "edge_count": len(edges),
        "mule_rings": detect_mule_rings()
    }


@app.get("/api/mule-rings")
def get_mule_rings():

    rings = detect_mule_rings()

    return {
        "count": len(rings),
        "rings": rings,
        "data_type": "SYNTHETIC DEMONSTRATION"
    }


@app.post("/api/demo/mule-ring")
def mule_ring_demo():

    result = create_mule_ring_demo()

    return {
        **result,
        "detected_rings": detect_mule_rings()
    }


# =========================================================
# MODEL METRICS
# =========================================================

@app.get("/api/model/metrics")
def get_model_metrics():

    return model_metrics


@app.get("/api/model/features")
def get_model_features():

    return [
        {
            "feature": name,
            "importance": round(float(value), 4)
        }
        for name, value in zip(
            model.feature_names_in_,
            model.feature_importances_
        )
    ]


# =========================================================
# DRIFT MONITORING DEMONSTRATION
# =========================================================

@app.post("/api/drift/simulate")
def simulate_drift():

    global drift_state

    baseline = [
        t["amount"] for t in transactions
        if t["demo_type"] != "DRIFT DEMONSTRATION"
    ]

    if not baseline:
        baseline = [500, 1200, 2500, 5000]

    baseline_average = float(np.mean(baseline))

    drift_transactions = []

    for _ in range(20):

        amount = random.randint(40000, 90000)

        transaction = generate_transaction(
            amount=amount,
            demo_type="DRIFT DEMONSTRATION"
        )

        add_transaction_to_storage(transaction)

        drift_transactions.append(transaction)

    current_average = float(
        np.mean([t["amount"] for t in drift_transactions])
    )

    drift_state = {
        "active": True,
        "message": "Synthetic high-value transaction distribution shift generated",
        "baseline_average_amount": round(baseline_average, 2),
        "current_average_amount": round(current_average, 2)
    }

    return drift_state


@app.get("/api/drift")
def get_drift():

    return drift_state


# =========================================================
# SYNTHETIC FAIRNESS MONITORING
# =========================================================

@app.get("/api/fairness")
def get_fairness():

    segment_results = []

    for segment in [
        "Segment A",
        "Segment B",
        "Segment C"
    ]:

        false_positive_rate = round(
            random.uniform(2, 9), 2
        )

        segment_results.append({
            "segment": segment,
            "false_positive_rate": false_positive_rate,
            "data_type": "SYNTHETIC"
        })

    return {
        "status": "DEMONSTRATION",
        "segments": segment_results,
        "message": (
            "Illustrative synthetic segment monitoring. "
            "Not a real-world fairness assessment."
        )
    }


# =========================================================
# ANALYTICS
# =========================================================

@app.get("/api/analytics")
def get_analytics():

    return {
        "transaction_count": len(transactions),
        "alert_count": len(alerts),
        "average_amount": round(
            float(np.mean([
                t["amount"] for t in transactions
            ])) if transactions else 0,
            2
        ),
        "average_risk": round(
            float(np.mean([
                t["risk_score"] for t in transactions
            ])) if transactions else 0,
            2
        ),
        "mule_ring_count": len(detect_mule_rings()),
        "stream": stream_state,
        "drift": drift_state
    }