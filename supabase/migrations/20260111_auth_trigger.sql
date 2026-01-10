-- 1. Create the Function handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    nama,
    asal_sekolah,
    no_hp,
    ukuran_baju,
    status_kepegawaian,
    pendidikan_terakhir,
    jurusan,
    mapel,
    kelas,
    role,
    is_active
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'nama',
    new.raw_user_meta_data->>'asal_sekolah',
    new.raw_user_meta_data->>'no_hp',
    new.raw_user_meta_data->>'ukuran_baju',
    new.raw_user_meta_data->>'status_kepegawaian',
    new.raw_user_meta_data->>'pendidikan_terakhir',
    new.raw_user_meta_data->>'jurusan',
    ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'mapel_diampu')),
    ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'kelas_mengajar')),
    'Anggota', -- Default Role
    false      -- Default Active
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
