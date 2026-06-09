import uuid

from fastapi import APIRouter, Depends

from auth import get_current_user

router = APIRouter(prefix="/cluster", tags=["cluster"], dependencies=[Depends(get_current_user)])


@router.get("/get_clusters")
def get_clusters():
    return

@router.get("/get_cluster/{cluster_id}")
def get_cluster(cluster_id: uuid.UUID):
    return

@router.post("/create_cluster")
def create_cluster():
    return

@router.put("/update_cluster/{cluster_id}")
def update_cluster(cluster_id: uuid.UUID):
    return

@router.delete("/delete_cluster/{cluster_id}")
def delete_cluster(cluster_id: uuid.UUID):
    return


@router.post("/generate_secret_token/{cluster_id}")
def generate_secret_token(cluster_id: uuid.UUID):
    return





