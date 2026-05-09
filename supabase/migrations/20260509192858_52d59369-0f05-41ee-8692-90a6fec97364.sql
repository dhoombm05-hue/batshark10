DO $$
DECLARE
  v_project_id uuid;
  v_entry_id uuid;
BEGIN
  SELECT id INTO v_project_id FROM public.projects WHERE slug = 'batshark99';
  IF v_project_id IS NULL THEN
    INSERT INTO public.projects (slug, name, name_en, description, status, ownership_percentage)
    VALUES ('batshark99', 'بات شارك 99', 'Batshark 99', 'منصة بناء وتعزيز الأعمال الرقمية الاحترافية', 'breakeven', 100)
    RETURNING id INTO v_project_id;

    INSERT INTO public.journal_entries (description, project_id, created_by, notes)
    VALUES ('اشتراك تأسيس منصة بات شارك 99', v_project_id, 'system', 'أول مصروف للمنصة - رسوم اشتراك التأسيس')
    RETURNING id INTO v_entry_id;

    INSERT INTO public.journal_lines (journal_entry_id, account_name, account_type, debit, credit, notes) VALUES
      (v_entry_id, 'مصروف اشتراك المنصة', 'expense', 100, 0, 'اشتراك التأسيس'),
      (v_entry_id, 'النقدية', 'asset',     0, 100, 'دفع نقدي');

    UPDATE public.projects SET total_expenses = 100, net_profit = -100, status = 'loss' WHERE id = v_project_id;
  END IF;
END $$;