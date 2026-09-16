-- Board Meetings Table
CREATE TABLE board_meetings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Board Meeting Attendances Table
CREATE TABLE board_meeting_attendances (
  meeting_id UUID REFERENCES board_meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  attended_at TIMESTAMPTZ DEFAULT NOW(),
  attendance_method VARCHAR(50) DEFAULT 'manual', -- 'qr' or 'manual'
  recorded_by UUID REFERENCES profiles(id),
  PRIMARY KEY (meeting_id, user_id)
);

-- Row Level Security (RLS) Setup
ALTER TABLE board_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_meeting_attendances ENABLE ROW LEVEL SECURITY;

-- Policies for board_meetings
-- Admins can do everything
CREATE POLICY "Admins can manage board meetings" 
ON board_meetings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- Pengurus can read board meetings
CREATE POLICY "Pengurus can view board meetings" 
ON board_meetings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Pengurus', 'Admin')
  )
);

-- Policies for board_meeting_attendances
-- Admins can do everything
CREATE POLICY "Admins can manage attendances" 
ON board_meeting_attendances 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- Pengurus can read all attendances for meetings they can see
CREATE POLICY "Pengurus can view attendances" 
ON board_meeting_attendances 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Pengurus', 'Admin')
  )
);

-- Pengurus can insert their own attendance
CREATE POLICY "Pengurus can submit their own attendance" 
ON board_meeting_attendances 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Pengurus', 'Admin')
  )
);
