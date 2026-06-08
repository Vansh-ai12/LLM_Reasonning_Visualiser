from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
import uuid
from datetime import datetime

from sqlalchemy import Column, String, CheckConstraint


class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    clusters: List["Cluster"] = Relationship(back_populates="user")


class Cluster(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    name: str
    description: Optional[str] = None
    status: str = Field(default="active")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional["User"] = Relationship(back_populates="clusters")
    runs: List["ReasoningRun"] = Relationship(back_populates="cluster")


class ReasoningStep(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: uuid.UUID = Field(foreign_key="reasoningrun.id")
    
    type: str = Field(
        sa_column=Column(
            String,
            CheckConstraint("type IN ('hypothesis','lookup','calculation','correction','conclusion')", name="ck_step_type"),
            nullable=False
        )
    )
    confidence: str = Field(
        sa_column=Column(
            String,
            CheckConstraint("confidence IN ('high','medium','low')", name="ck_step_confidence"),
            nullable=False
        )
    )
    
    label: str
    content: str
    entropy: Optional[float] = None  
    depends_on: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    run: Optional["ReasoningRun"] = Relationship(back_populates="steps")


class ReasoningRun(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    cluster_id: uuid.UUID = Field(foreign_key="cluster.id")
    
    reasoning_type: str = Field(
        sa_column=Column(
            String,
            CheckConstraint("reasoning_type IN ('research','testing')", name="ck_run_type"),
            nullable=False
        )
    )
    
    input_data: str
    output_data: str
    summary: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    cluster: Optional["Cluster"] = Relationship(back_populates="runs")
    steps: List["ReasoningStep"] = Relationship(back_populates="run")