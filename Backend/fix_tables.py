#!/usr/bin/env python3
"""
This script updates Django models to use existing table names
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ims_backend.settings')
django.setup()

import sqlite3

# Rename tables to match Django expectations
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

print("Renaming tables...")
cursor.execute("ALTER TABLE core_user RENAME TO users_user")
cursor.execute("ALTER TABLE core_department RENAME TO departments_department")
cursor.execute("ALTER TABLE core_candidate RENAME TO candidates_candidate")
cursor.execute("ALTER TABLE core_intern RENAME TO interns_intern")
cursor.execute("ALTER TABLE core_stipend RENAME TO stipends_stipend")
cursor.execute("ALTER TABLE core_leaverequest RENAME TO leaves_leaverequest")
cursor.execute("ALTER TABLE core_extensionrequest RENAME TO extensions_extensionrequest")
cursor.execute("ALTER TABLE core_extensionpermission RENAME TO extensions_extensionpermission")
cursor.execute("ALTER TABLE core_exitrequest RENAME TO exits_exitrequest")
cursor.execute("ALTER TABLE core_holiday RENAME TO holidays_holiday")
conn.commit()
conn.close()

print("Tables renamed successfully!")
print("\nVerifying new table names:")
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_%' ORDER BY name")
tables = cursor.fetchall()
for table in tables:
    print(f"  - {table[0]}")
conn.close()
