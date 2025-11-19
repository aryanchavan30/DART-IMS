-- Rename core_* tables to new app structure
ALTER TABLE core_user RENAME TO users_user;
ALTER TABLE core_department RENAME TO departments_department;
ALTER TABLE core_candidate RENAME TO candidates_candidate;
ALTER TABLE core_intern RENAME TO interns_intern;
ALTER TABLE core_stipend RENAME TO stipends_stipend;
ALTER TABLE core_leaverequest RENAME TO leaves_leaverequest;
ALTER TABLE core_extensionrequest RENAME TO extensions_extensionrequest;
ALTER TABLE core_extensionpermission RENAME TO extensions_extensionpermission;
ALTER TABLE core_exitrequest RENAME TO exits_exitrequest;
ALTER TABLE core_holiday RENAME TO holidays_holiday;

-- Update foreign key constraints to point to new table names
