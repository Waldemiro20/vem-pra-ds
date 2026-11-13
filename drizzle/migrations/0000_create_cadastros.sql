CREATE TABLE public.cadastros_ds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 120),
  whatsapp text NOT NULL CHECK (whatsapp ~ '^\(\d{2}\) \d{5}-\d{4}$'),
  localidade text NOT NULL CHECK (char_length(localidade) BETWEEN 2 AND 120),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.cadastros_ds TO anon, authenticated;
GRANT ALL ON public.cadastros_ds TO service_role;
ALTER TABLE public.cadastros_ds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um pode se cadastrar" ON public.cadastros_ds FOR INSERT TO anon, authenticated WITH CHECK (true);