from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
import uuid
from datetime import datetime


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


class ReasoningRun(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    cluster_id: uuid.UUID = Field(foreign_key="cluster.id")
    input_data: str
    output_data: str
    reasoning_type: str        # 'research' or 'testing'
    summary: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    cluster: Optional["Cluster"] = Relationship(back_populates="runs")
    steps: List["ReasoningStep"] = Relationship(back_populates="run")


class ReasoningStep(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: uuid.UUID = Field(foreign_key="reasoningrun.id")
    type: str
    label: str
    content: str
    depends_on: str            # JSON string e.g. "[1, 2]"
    confidence: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    run: Optional["ReasoningRun"] = Relationship(back_populates="steps")