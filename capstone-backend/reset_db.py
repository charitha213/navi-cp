# from database.db import engine
# from database.models import Base
# from sqlalchemy import inspect
#
# def reset_database():
#     # Drop all existing tables
#     print("Dropping all existing tables...")
#     Base.metadata.drop_all(bind=engine)
#     print("All tables dropped successfully.")
#
#     # Create all tables based on models
#     print("Creating new tables...")
#     Base.metadata.create_all(bind=engine)
#     print("All tables created successfully.")
#
#     # Inspect and print table names to confirm
#     inspector = inspect(engine)
#     tables = inspector.get_table_names()
#     print("Current tables in database:", tables)
#
# if __name__ == "__main__":
#     try:
#         reset_database()
#     except Exception as e:
#         print(f"An error occurred: {str(e)}")


#
# from sqlalchemy.orm import sessionmaker
# from sqlalchemy.inspection import inspect
# from database.db import engine
# from database.models import Base  # Assuming all models inherit from this Base
#
# Session = sessionmaker(bind=engine)
# session = Session()
#
# # Loop through all model classes mapped to Base
# for cls in Base.__subclasses__():
#     table_name = cls.__tablename__
#     print(f"\n--- Table: {table_name} ---")
#
#     # Query all records
#     records = session.query(cls).all()
#
#     for record in records:
#         # Filter out internal SQLAlchemy attributes
#         record_data = {
#             k: v for k, v in record.__dict__.items() if not k.startswith('_')
#         }
#         print(record_data)
