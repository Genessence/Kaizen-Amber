"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2025-11-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create plants table
    op.create_table('plants',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('short_name', sa.String(), nullable=False),
        sa.Column('division', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_plants_id'), 'plants', ['id'], unique=False)
    
    # Create categories table
    op.create_table('categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False),
        sa.Column('color_class', sa.String(), nullable=False),
        sa.Column('icon_name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_slug'), 'categories', ['slug'], unique=True)
    
    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('plant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['plant_id'], ['plants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    
    # Create best_practices table
    op.create_table('best_practices',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('submitted_by_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('plant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('problem_statement', sa.Text(), nullable=False),
        sa.Column('solution', sa.Text(), nullable=False),
        sa.Column('benefits', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('metrics', sa.Text(), nullable=True),
        sa.Column('implementation', sa.Text(), nullable=True),
        sa.Column('investment', sa.Text(), nullable=True),
        sa.Column('savings_amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('savings_currency', sa.String(), nullable=True),
        sa.Column('savings_period', sa.String(), nullable=True),
        sa.Column('area_implemented', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='draft'),
        sa.Column('submitted_date', sa.Date(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.ForeignKeyConstraint(['plant_id'], ['plants.id'], ),
        sa.ForeignKeyConstraint(['submitted_by_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_best_practices_category', 'best_practices', ['category_id'], unique=False)
    op.create_index('idx_best_practices_plant_date', 'best_practices', ['plant_id', sa.text('submitted_date DESC')], unique=False)
    op.create_index('idx_best_practices_status', 'best_practices', ['status'], unique=False, postgresql_where=sa.text('is_deleted = false'))
    op.create_index(op.f('ix_best_practices_id'), 'best_practices', ['id'], unique=False)
    op.create_index(op.f('ix_best_practices_submitted_date'), 'best_practices', ['submitted_date'], unique=False)
    op.create_index(op.f('ix_best_practices_title'), 'best_practices', ['title'], unique=False)
    
    # Create practice_images table
    op.create_table('practice_images',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('practice_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('image_type', sa.String(), nullable=False),
        sa.Column('blob_container', sa.String(), nullable=False),
        sa.Column('blob_name', sa.String(), nullable=False),
        sa.Column('blob_url', sa.Text(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['practice_id'], ['best_practices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_practice_images_id'), 'practice_images', ['id'], unique=False)
    
    # Create practice_documents table
    op.create_table('practice_documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('practice_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_name', sa.String(), nullable=False),
        sa.Column('blob_container', sa.String(), nullable=False),
        sa.Column('blob_name', sa.String(), nullable=False),
        sa.Column('blob_url', sa.Text(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['practice_id'], ['best_practices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_practice_documents_id'), 'practice_documents', ['id'], unique=False)
    
    # Create benchmarked_practices table
    op.create_table('benchmarked_practices',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('practice_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('benchmarked_by_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('benchmarked_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['benchmarked_by_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['practice_id'], ['best_practices.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_benchmarked_practices_date', 'benchmarked_practices', [sa.text('benchmarked_date DESC')], unique=False)
    op.create_index(op.f('ix_benchmarked_practices_id'), 'benchmarked_practices', ['id'], unique=False)
    op.create_index(op.f('ix_benchmarked_practices_practice_id'), 'benchmarked_practices', ['practice_id'], unique=True)
    
    # Create copied_practices table
    op.create_table('copied_practices',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('original_practice_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('copied_practice_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('copying_plant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('copied_date', sa.Date(), nullable=False),
        sa.Column('implementation_status', sa.String(), nullable=False, server_default='planning'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['copied_practice_id'], ['best_practices.id'], ),
        sa.ForeignKeyConstraint(['copying_plant_id'], ['plants.id'], ),
        sa.ForeignKeyConstraint(['original_practice_id'], ['best_practices.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_copied_practices_original_plant', 'copied_practices', ['original_practice_id', 'copying_plant_id'], unique=False)
    op.create_index(op.f('ix_copied_practices_id'), 'copied_practices', ['id'], unique=False)
    
    # Create practice_questions table
    op.create_table('practice_questions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('practice_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('asked_by_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('answer_text', sa.Text(), nullable=True),
        sa.Column('answered_by_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('answered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['answered_by_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['asked_by_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['practice_id'], ['best_practices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_practice_questions_practice', 'practice_questions', ['practice_id', sa.text('created_at DESC')], unique=False)
    op.create_index(op.f('ix_practice_questions_id'), 'practice_questions', ['id'], unique=False)
    
    # Create monthly_savings table
    op.create_table('monthly_savings',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('plant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('total_savings', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'),
        sa.Column('savings_currency', sa.String(), nullable=False, server_default='lakhs'),
        sa.Column('practice_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('stars', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['plant_id'], ['plants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('plant_id', 'year', 'month', name='uq_monthly_savings_plant_year_month')
    )
    op.create_index('idx_monthly_savings_plant_year', 'monthly_savings', ['plant_id', 'year', sa.text('month DESC')], unique=False)
    op.create_index(op.f('ix_monthly_savings_id'), 'monthly_savings', ['id'], unique=False)
    op.create_index(op.f('ix_monthly_savings_plant_id'), 'monthly_savings', ['plant_id'], unique=False)
    
    # Create leaderboard_entries table
    op.create_table('leaderboard_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('plant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('total_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('origin_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('copier_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['plant_id'], ['plants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('plant_id', 'year', name='uq_leaderboard_plant_year')
    )
    op.create_index('idx_leaderboard_year_points', 'leaderboard_entries', ['year', sa.text('total_points DESC')], unique=False)
    op.create_index(op.f('ix_leaderboard_entries_id'), 'leaderboard_entries', ['id'], unique=False)
    op.create_index(op.f('ix_leaderboard_entries_plant_id'), 'leaderboard_entries', ['plant_id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('leaderboard_entries')
    op.drop_table('monthly_savings')
    op.drop_table('practice_questions')
    op.drop_table('copied_practices')
    op.drop_table('benchmarked_practices')
    op.drop_table('practice_documents')
    op.drop_table('practice_images')
    op.drop_table('best_practices')
    op.drop_table('users')
    op.drop_table('categories')
    op.drop_table('plants')

