from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
import uuid
from datetime import datetime
from sqlalchemy import Column, String, CheckConstraint, Text


class User(SQLModel, table=True):
    id:         uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name:       str
    email:      str = Field(unique=True, index=True)
    password:   str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    runs: List["ReasoningRun"] = Relationship(back_populates="user")


class ReasoningRun(SQLModel, table=True):
    id:           uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id:      uuid.UUID = Field(foreign_key="user.id")

    reasoning_type: str = Field(
        sa_column=Column(
            String,
            CheckConstraint(
                "reasoning_type IN ('research','testing')",
                name="ck_run_type"
            ),
            nullable=False
        )
    )

    input_data:        str
    output_data:       str
    summary:           Optional[str]   = None

    # decoding config — log exactly how the model was run
    decoding_strategy: str             = Field(default="greedy")
    temperature:       Optional[float] = None   # None when greedy
    top_p:             Optional[float] = None   # None when greedy
    top_k:             Optional[int]   = None   # None when greedy
    model_name:        str             = Field(default="Qwen/Qwen2.5-3B-Instruct")
    max_new_tokens:    int             = Field(default=200)

    created_at: datetime = Field(default_factory=datetime.utcnow)

    user:  Optional["User"]          = Relationship(back_populates="runs")
    steps: List["ReasoningStep"]     = Relationship(back_populates="run")


class ReasoningStep(SQLModel, table=True):
    id:     Optional[int] = Field(default=None, primary_key=True)
    run_id: uuid.UUID     = Field(foreign_key="reasoningrun.id")

    type: str = Field(
        sa_column=Column(
            String,
            CheckConstraint(
                "type IN ('hypothesis','lookup','calculation','correction','conclusion')",
                name="ck_step_type"
            ),
            nullable=False
        )
    )
    confidence: str = Field(
        sa_column=Column(
            String,
            CheckConstraint(
                "confidence IN ('high','medium','low')",
                name="ck_step_confidence"
            ),
            nullable=False
        )
    )

    label:      str
    content:    str
    depends_on: str            # JSON string e.g. "[1, 2]"

    # entropy metrics
    entropy:     Optional[float] = None   # mean entropy across step tokens
    entropy_min: Optional[float] = None   # lowest entropy token in step
    entropy_max: Optional[float] = None   # highest entropy token in step
    entropy_var: Optional[float] = None   # variance — how spiky uncertainty was

    # token metrics
    token_count:     Optional[int]   = None   # how many tokens this step took
    avg_chosen_prob: Optional[float] = None   # avg prob of actually chosen tokens

    # flags
    is_correction:   bool            = Field(default=False)

    # alternatives — JSON string of top-5 tokens at step's first token
    top_alternatives: Optional[str]  = None

    # decoding used for this step
    decoding: str = Field(default="greedy")

    created_at: datetime = Field(default_factory=datetime.utcnow)

    run: Optional["ReasoningRun"] = Relationship(back_populates="steps")