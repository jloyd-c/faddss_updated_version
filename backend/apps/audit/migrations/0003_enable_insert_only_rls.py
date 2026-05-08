from django.db import migrations


TABLES = ['audit_logs', 'profile_change_logs', 'participation_records']


def enable_insert_only_rls(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return

    statements = []
    for table in TABLES:
        statements.extend([
            f'ALTER TABLE "{table}" ENABLE ROW LEVEL SECURITY',
            f'ALTER TABLE "{table}" FORCE ROW LEVEL SECURITY',
            f'DROP POLICY IF EXISTS "{table}_select" ON "{table}"',
            f'DROP POLICY IF EXISTS "{table}_insert" ON "{table}"',
            f'DROP POLICY IF EXISTS "{table}_update" ON "{table}"',
            f'DROP POLICY IF EXISTS "{table}_delete" ON "{table}"',
            f'CREATE POLICY "{table}_select" ON "{table}" FOR SELECT USING (true)',
            f'CREATE POLICY "{table}_insert" ON "{table}" FOR INSERT WITH CHECK (true)',
            f'CREATE POLICY "{table}_update" ON "{table}" FOR UPDATE USING (false)',
            f'CREATE POLICY "{table}_delete" ON "{table}" FOR DELETE USING (false)',
        ])

    with schema_editor.connection.cursor() as cursor:
        for statement in statements:
            cursor.execute(statement)


def disable_insert_only_rls(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return

    with schema_editor.connection.cursor() as cursor:
        for table in TABLES:
            cursor.execute(f'DROP POLICY IF EXISTS "{table}_select" ON "{table}"')
            cursor.execute(f'DROP POLICY IF EXISTS "{table}_insert" ON "{table}"')
            cursor.execute(f'DROP POLICY IF EXISTS "{table}_update" ON "{table}"')
            cursor.execute(f'DROP POLICY IF EXISTS "{table}_delete" ON "{table}"')
            cursor.execute(f'ALTER TABLE "{table}" NO FORCE ROW LEVEL SECURITY')
            cursor.execute(f'ALTER TABLE "{table}" DISABLE ROW LEVEL SECURITY')


class Migration(migrations.Migration):

    dependencies = [
        ('audit', '0002_initial'),
        ('cycles', '0002_initial'),
    ]

    operations = [
        migrations.RunPython(enable_insert_only_rls, disable_insert_only_rls),
    ]
