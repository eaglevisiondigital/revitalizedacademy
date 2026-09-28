-- Keep household integrity enforcement private while allowing authenticated
-- application writes to pass through the owned trigger boundary.
--
-- The trigger functions already pin search_path. Running them as their owner
-- lets them call private.assert_household_composition() without granting
-- authenticated clients direct EXECUTE on private validation helpers.

alter function private.validate_active_household_after_member_change()
  security definer;

alter function private.validate_household_activation()
  security definer;
