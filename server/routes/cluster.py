from typing import List
import uuid

from fastapi import APIRouter, Depends

from schemas import ClusterCreate , ClusterResponse
from sqlmodel import Session

from fastapi import HTTPException

from sqlmodel import select

from models import Cluster

from db_connect import get_session

from auth import get_current_user

router = APIRouter(prefix="/cluster", tags=["cluster"], dependencies=[Depends(get_current_user)])


@router.get("/get_clusters",response_model=List[ClusterResponse])
def get_clusters(current_user=Depends(get_current_user),db: Session=Depends(get_session)):
    user_id = uuid.UUID(current_user["user_id"])
    clusters = db.exec(
    select(Cluster).where(Cluster.user_id == user_id)
    ).all()
    
    return clusters

@router.get("/get_cluster/{cluster_id}", response_model=ClusterResponse)
def get_cluster(
    cluster_id: uuid.UUID,
    db: Session = Depends(get_session),
    current_user=Depends(get_current_user),
    
):
    user_id = uuid.UUID(current_user["user_id"])

    clusterR = db.exec(
        select(Cluster).where(
            Cluster.id == cluster_id,
            Cluster.user_id == user_id
        )
    ).first()

    if clusterR is None:
        raise HTTPException(
            status_code=404,
            detail="Cluster not found"
        )

    return clusterR

@router.post("/create_cluster", response_model=ClusterResponse)
def create_cluster(cluster:ClusterCreate ,current_user=Depends(get_current_user) ,db: Session=Depends(get_session)):
    name = cluster.name
    description = cluster.description
    
    user_id = uuid.UUID(current_user["user_id"])

    clusters = db.exec(
    select(Cluster).where(Cluster.user_id == user_id)
    ).all()

    if len(clusters) >= 3:
        raise HTTPException(
            status_code=400,
            detail="You can create at most 3 clusters"
        )

    newCluster = Cluster(name=name , description=description , user_id= user_id)

    try:

        db.add(newCluster)
        db.commit()
        db.refresh(newCluster)
    except Exception as e:
        db.rollback()
        print(e)
        raise HTTPException(
            status_code=500,
            detail="Error occurred while creating the cluster"
        )
    

    return newCluster

@router.put("/update_cluster/{cluster_id}")
def update_cluster(cluster_id: uuid.UUID):
    return


@router.delete("/delete_cluster/{cluster_id}")
def delete_cluster(
    cluster_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session)
):

    try:
        user_id = uuid.UUID(current_user["user_id"])

        clusterR = db.exec(
            select(Cluster).where(
                Cluster.id == cluster_id,
                Cluster.user_id == user_id
            )
        ).first()

        if clusterR is None:
            raise HTTPException(
                status_code=404,
                detail="Cluster not found"
            )

        db.delete(clusterR)
        db.commit()

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        print(e)

        raise HTTPException(
            status_code=500,
            detail="Error occured while deleting the cluster"
        )

    return {
        "message": "Cluster deleted successfully"
    }