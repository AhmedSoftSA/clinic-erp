// ==============================================================
// Default demo data for local review.
// Password for all demo accounts: admin12345
// ==============================================================
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db, tables } from "../server/db";

const DEFAULT_PASSWORD = "admin12345";
type Role = "admin" | "doctor" | "staff" | "patient";

async function ensureUser(input: {
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  passwordHash: string;
}) {
  const existing = await db.query.users.findFirst({ where: eq(tables.users.email, input.email) });
  if (existing) {
    const [user] = await db
      .update(tables.users)
      .set({
        fullName: input.fullName,
        phone: input.phone,
        passwordHash: input.passwordHash,
        role: input.role,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(tables.users.id, existing.id))
      .returning();
    return user;
  }

  const [user] = await db
    .insert(tables.users)
    .values({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash: input.passwordHash,
      role: input.role,
      isActive: true,
    })
    .returning();

  return user;
}

async function ensurePatientProfile(input: {
  userId: string;
  nationalId: string;
  gender: "male" | "female";
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
}) {
  const existing = await db.query.patients.findFirst({ where: eq(tables.patients.userId, input.userId) });
  if (existing) {
    const [patient] = await db
      .update(tables.patients)
      .set({
        nationalId: input.nationalId,
        gender: input.gender,
        bloodType: input.bloodType,
        allergies: JSON.stringify(input.allergies),
        chronicConditions: JSON.stringify(input.chronicConditions),
        emergencyContactName: input.emergencyContactName,
        emergencyContactPhone: input.emergencyContactPhone,
        updatedAt: new Date(),
      })
      .where(eq(tables.patients.id, existing.id))
      .returning();
    return patient;
  }

  const [patient] = await db
    .insert(tables.patients)
    .values({
      userId: input.userId,
      nationalId: input.nationalId,
      gender: input.gender,
      bloodType: input.bloodType,
      allergies: JSON.stringify(input.allergies),
      chronicConditions: JSON.stringify(input.chronicConditions),
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
    })
    .returning();

  return patient;
}

async function ensureDoctorProfile(input: {
  userId: string;
  specialty: string;
  licenseNumber: string;
  bio: string;
  consultationFee: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes?: number;
}) {
  let doctor = await db.query.doctors.findFirst({ where: eq(tables.doctors.userId, input.userId) });
  if (doctor) {
    [doctor] = await db
      .update(tables.doctors)
      .set({
        specialty: input.specialty,
        licenseNumber: input.licenseNumber,
        bio: input.bio,
        consultationFee: input.consultationFee,
        updatedAt: new Date(),
      })
      .where(eq(tables.doctors.id, doctor.id))
      .returning();
  } else {
    [doctor] = await db
      .insert(tables.doctors)
      .values({
        userId: input.userId,
        specialty: input.specialty,
        licenseNumber: input.licenseNumber,
        bio: input.bio,
        consultationFee: input.consultationFee,
      })
      .returning();
  }

  for (const dayOfWeek of [0, 1, 2, 3, 4, 6]) {
    const schedule = await db.query.doctorSchedules.findFirst({
      where: and(eq(tables.doctorSchedules.doctorId, doctor.id), eq(tables.doctorSchedules.dayOfWeek, dayOfWeek)),
    });

    if (schedule) {
      await db
        .update(tables.doctorSchedules)
        .set({
          startTime: input.startTime,
          endTime: input.endTime,
          slotDurationMinutes: input.slotDurationMinutes ?? 30,
          isActive: true,
        })
        .where(eq(tables.doctorSchedules.id, schedule.id));
    } else {
      await db.insert(tables.doctorSchedules).values({
        doctorId: doctor.id,
        dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        slotDurationMinutes: input.slotDurationMinutes ?? 30,
        isActive: true,
      });
    }
  }

  return doctor;
}

function atToday(hour: number, minute = 0) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function atOffset(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function ensureAppointment(input: {
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  status: "confirmed" | "checked_in" | "in_progress" | "completed";
  reasonForVisit: string;
  queuePosition?: number;
}) {
  const existing = await db.query.appointments.findFirst({
    where: and(
      eq(tables.appointments.patientId, input.patientId),
      eq(tables.appointments.doctorId, input.doctorId),
      eq(tables.appointments.scheduledAt, input.scheduledAt)
    ),
  });

  if (existing) {
    const [appointment] = await db
      .update(tables.appointments)
      .set({
        status: input.status,
        reasonForVisit: input.reasonForVisit,
        queuePosition: input.queuePosition,
        checkedInAt: input.status === "checked_in" || input.status === "in_progress" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(tables.appointments.id, existing.id))
      .returning();
    return appointment;
  }

  const [appointment] = await db
    .insert(tables.appointments)
    .values({
      patientId: input.patientId,
      doctorId: input.doctorId,
      scheduledAt: input.scheduledAt,
      status: input.status,
      reasonForVisit: input.reasonForVisit,
      queuePosition: input.queuePosition,
      checkedInAt: input.status === "checked_in" || input.status === "in_progress" ? new Date() : undefined,
    })
    .returning();

  return appointment;
}

async function ensureClinicalRecord(input: {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  symptoms: string;
  diagnosis: string;
  notes: string;
  medications: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
  reportTitle: string;
  reportContent: string;
}) {
  let consultation = await db.query.consultations.findFirst({
    where: eq(tables.consultations.appointmentId, input.appointmentId),
  });

  if (!consultation) {
    [consultation] = await db
      .insert(tables.consultations)
      .values({
        appointmentId: input.appointmentId,
        doctorId: input.doctorId,
        patientId: input.patientId,
        symptoms: input.symptoms,
        diagnosis: input.diagnosis,
        notes: input.notes,
        vitals: JSON.stringify({ bp: "120/80", temp: "37.0", pulse: "78", weight: "74" }),
        isSigned: true,
        signedAt: new Date(),
      })
      .returning();
  }

  const prescription = await db.query.prescriptions.findFirst({
    where: eq(tables.prescriptions.consultationId, consultation.id),
  });
  if (!prescription) {
    await db.insert(tables.prescriptions).values({
      consultationId: consultation.id,
      medications: JSON.stringify(input.medications),
      instructions: "الالتزام بالجرعات وشرب الماء ومراجعة الطبيب عند استمرار الأعراض.",
    });
  }

  const report = await db.query.medicalReports.findFirst({
    where: eq(tables.medicalReports.consultationId, consultation.id),
  });
  if (!report) {
    await db.insert(tables.medicalReports).values({
      consultationId: consultation.id,
      patientId: input.patientId,
      title: input.reportTitle,
      content: input.reportContent,
      isSigned: true,
    });
  }

  return consultation;
}

async function ensureInvoice(input: {
  patientId: string;
  appointmentId: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  discount?: number;
  status: "paid" | "unpaid" | "partially_paid";
  paidByUserId?: string;
}) {
  const existing = await db.query.invoices.findFirst({
    where: eq(tables.invoices.appointmentId, input.appointmentId),
  });
  if (existing) return existing;

  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = input.discount ?? 0;
  const tax = (subtotal - discount) * 0.15;
  const total = subtotal - discount + tax;
  const [invoice] = await db
    .insert(tables.invoices)
    .values({
      patientId: input.patientId,
      appointmentId: input.appointmentId,
      items: JSON.stringify(input.items),
      subtotal,
      discount,
      tax,
      total,
      status: input.status,
    })
    .returning();

  if (input.status !== "unpaid" && input.paidByUserId) {
    await db.insert(tables.payments).values({
      invoiceId: invoice.id,
      amount: input.status === "partially_paid" ? Math.round(total / 2) : total,
      method: "card",
      receivedByUserId: input.paidByUserId,
    });
  }

  return invoice;
}

async function ensureNotification(userId: string, type: string, title: string, body: string) {
  const existing = await db.query.notifications.findFirst({
    where: and(eq(tables.notifications.userId, userId), eq(tables.notifications.type, type), eq(tables.notifications.title, title)),
  });
  if (!existing) {
    await db.insert(tables.notifications).values({ userId, type, title, body });
  }
}

export async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const admin = await ensureUser({
    fullName: "مدير النظام",
    email: "admin@clinic.com",
    phone: "0501000001",
    passwordHash,
    role: "admin",
  });

  const staff = await ensureUser({
    fullName: "موظف الاستقبال",
    email: "staff@clinic.com",
    phone: "0501000003",
    passwordHash,
    role: "staff",
  });

  const saraUser = await ensureUser({
    fullName: "د. سارة الأحمد",
    email: "doctor@clinic.com",
    phone: "0501000002",
    passwordHash,
    role: "doctor",
  });
  const saraDoctor = await ensureDoctorProfile({
    userId: saraUser.id,
    specialty: "طب عام",
    licenseNumber: "LIC-CLINIC-001",
    bio: "طبيبة أسرة تتابع الحالات المزمنة والزيارات الدورية.",
    consultationFee: 150,
    startTime: "09:00",
    endTime: "17:00",
  });

  const khalidUser = await ensureUser({
    fullName: "د. خالد العتيبي",
    email: "dentist@clinic.com",
    phone: "0501000005",
    passwordHash,
    role: "doctor",
  });
  const khalidDoctor = await ensureDoctorProfile({
    userId: khalidUser.id,
    specialty: "طب أسنان",
    licenseNumber: "LIC-CLINIC-002",
    bio: "طبيب أسنان للتنظيف والحشوات وخطط العلاج الوقائية.",
    consultationFee: 220,
    startTime: "12:00",
    endTime: "20:00",
  });

  const noraUser = await ensureUser({
    fullName: "د. نورة السالم",
    email: "pediatric@clinic.com",
    phone: "0501000006",
    passwordHash,
    role: "doctor",
  });
  const noraDoctor = await ensureDoctorProfile({
    userId: noraUser.id,
    specialty: "أطفال",
    licenseNumber: "LIC-CLINIC-003",
    bio: "طبيبة أطفال لمتابعة النمو والتطعيمات والأعراض الموسمية.",
    consultationFee: 180,
    startTime: "10:00",
    endTime: "18:00",
  });

  const patientUser = await ensureUser({
    fullName: "محمد المريض",
    email: "patient@clinic.com",
    phone: "0501000004",
    passwordHash,
    role: "patient",
  });
  const patient = await ensurePatientProfile({
    userId: patientUser.id,
    nationalId: "1000000001",
    gender: "male",
    bloodType: "O+",
    allergies: ["حساسية موسمية"],
    chronicConditions: ["ضغط خفيف"],
    emergencyContactName: "أحمد المريض",
    emergencyContactPhone: "0500000000",
  });

  const secondPatientUser = await ensureUser({
    fullName: "ريم خالد",
    email: "patient2@clinic.com",
    phone: "0501000007",
    passwordHash,
    role: "patient",
  });
  const secondPatient = await ensurePatientProfile({
    userId: secondPatientUser.id,
    nationalId: "1000000002",
    gender: "female",
    bloodType: "A+",
    allergies: ["بنسلين"],
    chronicConditions: ["لا يوجد"],
    emergencyContactName: "خالد السالم",
    emergencyContactPhone: "0500000002",
  });

  const queueAppointment = await ensureAppointment({
    patientId: patient.id,
    doctorId: saraDoctor.id,
    scheduledAt: atToday(10, 30),
    status: "checked_in",
    reasonForVisit: "متابعة ضغط وصداع بسيط",
    queuePosition: 1,
  });

  const completedAppointment = await ensureAppointment({
    patientId: patient.id,
    doctorId: khalidDoctor.id,
    scheduledAt: atOffset(-3, 13, 0),
    status: "completed",
    reasonForVisit: "ألم في الضرس وتنظيف",
  });

  await ensureAppointment({
    patientId: secondPatient.id,
    doctorId: noraDoctor.id,
    scheduledAt: atToday(11, 30),
    status: "confirmed",
    reasonForVisit: "استشارة أطفال وتطعيم",
  });

  await ensureAppointment({
    patientId: patient.id,
    doctorId: noraDoctor.id,
    scheduledAt: atOffset(1, 16, 0),
    status: "confirmed",
    reasonForVisit: "متابعة عامة",
  });

  await ensureClinicalRecord({
    appointmentId: completedAppointment.id,
    doctorId: khalidDoctor.id,
    patientId: patient.id,
    symptoms: "ألم متقطع في الضرس مع حساسية للبارد.",
    diagnosis: "التهاب بسيط باللثة وحاجة إلى تنظيف دوري.",
    notes: "تم تنظيف الأسنان ووضع خطة متابعة بعد شهر.",
    medications: [{ name: "غسول فم طبي", dosage: "15ml", frequency: "مرتين يوميًا", duration: "7 أيام" }],
    reportTitle: "تقرير زيارة الأسنان",
    reportContent: "تم فحص الأسنان واللثة، الحالة مستقرة مع توصية بتنظيف دوري ومراجعة بعد شهر.",
  });

  await ensureInvoice({
    patientId: patient.id,
    appointmentId: completedAppointment.id,
    items: [
      { description: "كشف طبيب أسنان", quantity: 1, unitPrice: 220 },
      { description: "تنظيف أسنان", quantity: 1, unitPrice: 180 },
    ],
    discount: 20,
    status: "paid",
    paidByUserId: staff.id,
  });

  await ensureInvoice({
    patientId: patient.id,
    appointmentId: queueAppointment.id,
    items: [{ description: "كشف طب عام", quantity: 1, unitPrice: 150 }],
    status: "unpaid",
  });

  await ensureNotification(patientUser.id, "demo_welcome", "مرحبًا بك في عيادتي", "تم تجهيز حسابك التجريبي بموعد وفاتورة وملف طبي.");
  await ensureNotification(saraUser.id, "demo_queue", "مريض في الطابور", "يوجد مريض مسجل وصوله بانتظار الفحص.");
  await ensureNotification(admin.id, "demo_admin", "بيانات تجريبية جاهزة", "تم تجهيز المستخدمين والأطباء والمرضى والفواتير.");

  console.log("Demo data is ready.");
  console.log(`Password: ${DEFAULT_PASSWORD}`);
  console.log("admin@clinic.com | doctor@clinic.com | staff@clinic.com | patient@clinic.com");
}

if (process.argv[1] && process.argv[1].endsWith("seed.ts")) { main(); }
