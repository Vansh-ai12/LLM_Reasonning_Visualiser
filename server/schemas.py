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

class ReasoningRequest(BaseModel):
    user_id: uuid.UUID
    input_data: str
    reasoning_type: Literal['research','testing']

class ResearchAskRequest(BaseModel):
    question: str = Field(description="The original user question to send through memory retrieval and LLM tracing")


class ReasoningStep(BaseModel):
    id: int
    type: Literal['hypothesis', 'lookup', 'calculation', 'correction', 'conclusion']
    label: str
    content: str
    depends_on: List[int] = Field(default_factory=list)
    confidence: Literal['high', 'medium', 'low']



class RunResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    reasoning_type: str
    input_data: str
    output_data: str
    summary: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class StepResponse(BaseModel):
    id: Optional[int]
    run_id: uuid.UUID
    type: str
    confidence: str
    label: str
    content: str
    depends_on: str
    entropy: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)
