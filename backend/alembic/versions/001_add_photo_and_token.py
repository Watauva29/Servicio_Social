"""add photo and token

Revision ID: 001_add_photo_and_token
Revises: 
Create Date: 2026-08-17 12:25:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001_add_photo_and_token'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add photo_url and reset_token columns to users table
    op.add_column('users', sa.Column('photo_url', sa.String(), nullable=True))
    op.add_column('users', sa.Column('reset_token', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('users', 'reset_token')
    op.drop_column('users', 'photo_url')
