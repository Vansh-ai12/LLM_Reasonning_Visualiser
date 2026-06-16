from datetime import datetime

from pydantic import BaseModel , Field , ConfigDict

from typing import Optional,List , Literal

import uuid


class UserCreate(BaseModel):
    name:str = Field( description="The name of the user")
    email:str = Field( description="The email address of the user")
    password:str = Field( description="The password of the user" , min_length=8)


class UserLogin(BaseModel):
    email:str = Field( description="The email address of the user")
    password:str = Field( description="The password of the user" , min_length=8)


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str

class ClusterCreate(BaseModel):
    name:str = Field( description="The name of the cluster")
    description: Optional[str] = Field( description="The description of the cluster")

class ClusterResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    status: str

    model_config = ConfigDict(from_attributes=True)

class ReasoningRequest(BaseModel):
    cluster_id: uuid.UUID
    input_data: str
    reasoning_type: Literal['research','testing']


class ReasoningStep(BaseModel):
    id: int
    type: Literal['hypothesis', 'lookup', 'calculation', 'correction', 'conclusion']
    label: str
    content: str
    depends_on: List[int] = Field(default_factory=list)
    confidence: Literal['high', 'medium', 'low']

class ReasoningResponse(BaseModel):
    cluster_id: uuid.UUID
    output_data: str
    reasoning_steps: List[ReasoningStep]   
    reasoning_type: Literal['research', 'testing']
    summary: Optional[str] = None
    created_at: datetime







