INSERT INTO cfg_ticket_categories (id, name, icon_name, color, created_at, updated_at) VALUES
('32fbfd06-ad20-49ff-a871-6ec2fc9ec295', 'Repair', 'Wrench', '#ca8a04', '2026-06-06 15:58:32.628908+00', '2026-06-06 15:58:32.628908+00'),
('3a83e20e-3c3d-461e-972f-3fa2f8feb335', 'Pickup', 'PackageOpen', '#9333ea', '2026-06-06 15:58:32.628908+00', '2026-06-06 15:58:32.628908+00'),
('87be1637-b60c-4783-b96a-dbf84a778c19', 'Installation', 'Hammer', '#6366f1', '2026-06-06 15:58:32.628908+00', '2026-06-06 15:58:32.628908+00'),
('b0ba2109-3ea6-4497-9cab-4b874be807d6', 'Replace', 'RefreshCw', '#f97316', '2026-06-06 15:58:32.628908+00', '2026-06-06 15:58:32.628908+00'),
('b2c74443-653f-443d-9235-cc7ef21feddc', 'Partial Pickup', 'PackageMinus', '#a855f7', '2026-06-06 15:58:32.628908+00', '2026-06-06 15:58:32.628908+00'),
('c0f4dd1c-121a-40a5-8763-5553490f85c0', 'Relocation', 'ArrowRightLeft', '#14b8a6', '2026-06-06 15:58:32.628908+00', '2026-06-06 15:58:32.628908+00'),
('c67521f2-6d04-4c1f-8195-6fa46c386e32', 'Upgrade', 'ArrowUpCircle', '#16a34a', '2026-06-06 15:58:32.628908+00', '2026-06-06 15:58:32.628908+00'),
('e73ce059-52aa-4c9b-867c-95509c60b985', 'Defaulter Pickup', 'AlertTriangle', '#ef4444', '2026-06-06 15:58:32.628908+00', '2026-06-06 15:58:32.628908+00'),
('ed099caa-4ec6-4296-92e4-12ade0b49249', 'Delivery', 'Truck', '#3b82f6', '2026-06-06 15:58:32.628908+00', '2026-06-06 15:58:32.628908+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon_name = EXCLUDED.icon_name,
  color = EXCLUDED.color;
