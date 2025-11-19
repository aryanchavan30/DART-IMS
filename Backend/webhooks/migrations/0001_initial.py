# Generated migration for webhooks app

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='JobApplication',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('full_name', models.CharField(max_length=255)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('contact_number', models.CharField(max_length=20)),
                ('date_of_birth', models.DateField()),
                ('gender', models.CharField(choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], max_length=10)),
                ('address', models.TextField()),
                ('linkedin_profile', models.URLField(blank=True, max_length=500, null=True)),
                ('college_name', models.CharField(max_length=255)),
                ('qualification', models.CharField(max_length=100)),
                ('branch', models.CharField(max_length=100)),
                ('year_of_passing', models.IntegerField()),
                ('applicant_status', models.CharField(choices=[('Pass-out', 'Pass-out'), ('Student', 'Student')], max_length=20)),
                ('area_of_interest', models.CharField(max_length=255)),
                ('preferred_location', models.CharField(max_length=255)),
                ('reference_by', models.CharField(blank=True, max_length=100)),
                ('cv', models.FileField(upload_to='cvs/%Y/%m/%d/')),
                ('photo', models.ImageField(upload_to='photos/%Y/%m/%d/')),
                ('signature', models.ImageField(upload_to='signatures/%Y/%m/%d/')),
                ('available_for_6_months', models.BooleanField(default=False)),
                ('willing_to_work_from_plant', models.BooleanField(default=False)),
                ('willing_to_work_in_shifts', models.BooleanField(default=False)),
                ('declaration_accepted', models.BooleanField(default=False)),
                ('jotform_unique_id', models.CharField(blank=True, max_length=100, null=True, unique=True)),
                ('submission_date', models.DateTimeField(auto_now_add=True)),
                ('application_id', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('status', models.CharField(choices=[('Pending', 'Pending'), ('Reviewed', 'Reviewed'), ('Approved', 'Approved'), ('Denied', 'Denied')], default='Pending', max_length=20)),
            ],
            options={
                'ordering': ['-submission_date'],
            },
        ),
    ]
