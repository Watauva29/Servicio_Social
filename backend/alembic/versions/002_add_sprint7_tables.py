"""add messages and settings

Revision ID: 002_add_sprint7_tables
Revises: 001_add_photo_and_token
Create Date: 2026-08-17 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_add_sprint7_tables'
down_revision: Union[str, None] = '001_add_photo_and_token'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # create global_settings table
    op.create_table('global_settings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('key', sa.String(), nullable=False),
    sa.Column('value', sa.String(), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_global_settings_id'), 'global_settings', ['id'], unique=False)
    op.create_index(op.f('ix_global_settings_key'), 'global_settings', ['key'], unique=True)

    # create messages table
    op.create_table('messages',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('sender_id', sa.Integer(), nullable=False),
    sa.Column('receiver_id', sa.Integer(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('read', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['receiver_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_messages_id'), 'messages', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_messages_id'), table_name='messages')
    op.drop_table('messages')
    op.drop_index(op.f('ix_global_settings_key'), table_name='global_settings')
    op.drop_index(op.f('ix_global_settings_id'), table_name='global_settings')
    op.drop_table('global_settings')
