from pydantic import BaseModel , Field

from typing import Optional,List

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
    