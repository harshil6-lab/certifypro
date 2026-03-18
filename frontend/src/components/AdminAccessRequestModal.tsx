import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  FileCheck,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitAccessRequest } from "@/lib/accessRequest";

type Step = 1 | 2 | 3 | 4;

interface AdminAccessFormData {
  fullName: string;
  organizationalEmail: string;
  jobTitle: string;
  phoneCountry: string;
  phoneNumber: string;
  organizationName: string;
  organizationWebsite: string;
  industry: string;
  organizationSize: string;
  country: string;
  linkedInProfile: string;
  reasonForAccess: string;
  organizationalIdFile: File | null;
  infoAccurate: boolean;
  orgAuthorizationConfirmed: boolean;
  verificationConsent: boolean;
}

interface FormErrors {
  fullName?: string;
  organizationalEmail?: string;
  organizationName?: string;
  organizationalIdFile?: string;
  infoAccurate?: string;
  orgAuthorizationConfirmed?: string;
  verificationConsent?: string;
}

interface AdminAccessRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INDUSTRY_OPTIONS = [
  "Education",
  "Corporate Training",
  "Government",
  "Healthcare",
  "Technology",
  "Non-Profit",
  "Other",
];

const ORG_SIZE_OPTIONS = [
  "1-50",
  "51-200",
  "201-1000",
  "1001-5000",
  "5000+",
];

const COUNTRY_OPTIONS = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "Singapore",
  "Other",
];

const PHONE_DIAL_CODE_OPTIONS = [
  { value: "AF", label: "Afghanistan", dialCode: "+93" },
  { value: "AL", label: "Albania", dialCode: "+355" },
  { value: "DZ", label: "Algeria", dialCode: "+213" },
  { value: "AD", label: "Andorra", dialCode: "+376" },
  { value: "AO", label: "Angola", dialCode: "+244" },
  { value: "AG", label: "Antigua and Barbuda", dialCode: "+1" },
  { value: "AR", label: "Argentina", dialCode: "+54" },
  { value: "AM", label: "Armenia", dialCode: "+374" },
  { value: "AU", label: "Australia", dialCode: "+61" },
  { value: "AT", label: "Austria", dialCode: "+43" },
  { value: "AZ", label: "Azerbaijan", dialCode: "+994" },
  { value: "BS", label: "Bahamas", dialCode: "+1" },
  { value: "BH", label: "Bahrain", dialCode: "+973" },
  { value: "BD", label: "Bangladesh", dialCode: "+880" },
  { value: "BB", label: "Barbados", dialCode: "+1" },
  { value: "BY", label: "Belarus", dialCode: "+375" },
  { value: "BE", label: "Belgium", dialCode: "+32" },
  { value: "BZ", label: "Belize", dialCode: "+501" },
  { value: "BJ", label: "Benin", dialCode: "+229" },
  { value: "BT", label: "Bhutan", dialCode: "+975" },
  { value: "BO", label: "Bolivia", dialCode: "+591" },
  { value: "BA", label: "Bosnia and Herzegovina", dialCode: "+387" },
  { value: "BW", label: "Botswana", dialCode: "+267" },
  { value: "BR", label: "Brazil", dialCode: "+55" },
  { value: "BN", label: "Brunei", dialCode: "+673" },
  { value: "BG", label: "Bulgaria", dialCode: "+359" },
  { value: "BF", label: "Burkina Faso", dialCode: "+226" },
  { value: "BI", label: "Burundi", dialCode: "+257" },
  { value: "KH", label: "Cambodia", dialCode: "+855" },
  { value: "CM", label: "Cameroon", dialCode: "+237" },
  { value: "CA", label: "Canada", dialCode: "+1" },
  { value: "CV", label: "Cape Verde", dialCode: "+238" },
  { value: "CF", label: "Central African Republic", dialCode: "+236" },
  { value: "TD", label: "Chad", dialCode: "+235" },
  { value: "CL", label: "Chile", dialCode: "+56" },
  { value: "CN", label: "China", dialCode: "+86" },
  { value: "CO", label: "Colombia", dialCode: "+57" },
  { value: "KM", label: "Comoros", dialCode: "+269" },
  { value: "CG", label: "Congo", dialCode: "+242" },
  { value: "CD", label: "Democratic Republic of Congo", dialCode: "+243" },
  { value: "CR", label: "Costa Rica", dialCode: "+506" },
  { value: "HR", label: "Croatia", dialCode: "+385" },
  { value: "CU", label: "Cuba", dialCode: "+53" },
  { value: "CY", label: "Cyprus", dialCode: "+357" },
  { value: "CZ", label: "Czechia", dialCode: "+420" },
  { value: "DK", label: "Denmark", dialCode: "+45" },
  { value: "DJ", label: "Djibouti", dialCode: "+253" },
  { value: "DM", label: "Dominica", dialCode: "+1" },
  { value: "DO", label: "Dominican Republic", dialCode: "+1" },
  { value: "EC", label: "Ecuador", dialCode: "+593" },
  { value: "EG", label: "Egypt", dialCode: "+20" },
  { value: "SV", label: "El Salvador", dialCode: "+503" },
  { value: "GQ", label: "Equatorial Guinea", dialCode: "+240" },
  { value: "ER", label: "Eritrea", dialCode: "+291" },
  { value: "EE", label: "Estonia", dialCode: "+372" },
  { value: "ET", label: "Ethiopia", dialCode: "+251" },
  { value: "FJ", label: "Fiji", dialCode: "+679" },
  { value: "FI", label: "Finland", dialCode: "+358" },
  { value: "FR", label: "France", dialCode: "+33" },
  { value: "GA", label: "Gabon", dialCode: "+241" },
  { value: "GM", label: "Gambia", dialCode: "+220" },
  { value: "GE", label: "Georgia", dialCode: "+995" },
  { value: "DE", label: "Germany", dialCode: "+49" },
  { value: "GH", label: "Ghana", dialCode: "+233" },
  { value: "GR", label: "Greece", dialCode: "+30" },
  { value: "GD", label: "Grenada", dialCode: "+1" },
  { value: "GT", label: "Guatemala", dialCode: "+502" },
  { value: "GN", label: "Guinea", dialCode: "+224" },
  { value: "GW", label: "Guinea-Bissau", dialCode: "+245" },
  { value: "GY", label: "Guyana", dialCode: "+592" },
  { value: "HT", label: "Haiti", dialCode: "+509" },
  { value: "HN", label: "Honduras", dialCode: "+504" },
  { value: "HK", label: "Hong Kong", dialCode: "+852" },
  { value: "HU", label: "Hungary", dialCode: "+36" },
  { value: "IS", label: "Iceland", dialCode: "+354" },
  { value: "IN", label: "India", dialCode: "+91" },
  { value: "ID", label: "Indonesia", dialCode: "+62" },
  { value: "IR", label: "Iran", dialCode: "+98" },
  { value: "IQ", label: "Iraq", dialCode: "+964" },
  { value: "IE", label: "Ireland", dialCode: "+353" },
  { value: "IL", label: "Israel", dialCode: "+972" },
  { value: "IT", label: "Italy", dialCode: "+39" },
  { value: "JM", label: "Jamaica", dialCode: "+1" },
  { value: "JP", label: "Japan", dialCode: "+81" },
  { value: "JO", label: "Jordan", dialCode: "+962" },
  { value: "KZ", label: "Kazakhstan", dialCode: "+7" },
  { value: "KE", label: "Kenya", dialCode: "+254" },
  { value: "KI", label: "Kiribati", dialCode: "+686" },
  { value: "KP", label: "North Korea", dialCode: "+850" },
  { value: "KR", label: "South Korea", dialCode: "+82" },
  { value: "KW", label: "Kuwait", dialCode: "+965" },
  { value: "KG", label: "Kyrgyzstan", dialCode: "+996" },
  { value: "LA", label: "Laos", dialCode: "+856" },
  { value: "LV", label: "Latvia", dialCode: "+371" },
  { value: "LB", label: "Lebanon", dialCode: "+961" },
  { value: "LS", label: "Lesotho", dialCode: "+266" },
  { value: "LR", label: "Liberia", dialCode: "+231" },
  { value: "LY", label: "Libya", dialCode: "+218" },
  { value: "LI", label: "Liechtenstein", dialCode: "+423" },
  { value: "LT", label: "Lithuania", dialCode: "+370" },
  { value: "LU", label: "Luxembourg", dialCode: "+352" },
  { value: "MO", label: "Macau", dialCode: "+853" },
  { value: "MK", label: "North Macedonia", dialCode: "+389" },
  { value: "MG", label: "Madagascar", dialCode: "+261" },
  { value: "MW", label: "Malawi", dialCode: "+265" },
  { value: "MY", label: "Malaysia", dialCode: "+60" },
  { value: "MV", label: "Maldives", dialCode: "+960" },
  { value: "ML", label: "Mali", dialCode: "+223" },
  { value: "MT", label: "Malta", dialCode: "+356" },
  { value: "MH", label: "Marshall Islands", dialCode: "+692" },
  { value: "MR", label: "Mauritania", dialCode: "+222" },
  { value: "MU", label: "Mauritius", dialCode: "+230" },
  { value: "MX", label: "Mexico", dialCode: "+52" },
  { value: "FM", label: "Micronesia", dialCode: "+691" },
  { value: "MD", label: "Moldova", dialCode: "+373" },
  { value: "MC", label: "Monaco", dialCode: "+377" },
  { value: "MN", label: "Mongolia", dialCode: "+976" },
  { value: "ME", label: "Montenegro", dialCode: "+382" },
  { value: "MA", label: "Morocco", dialCode: "+212" },
  { value: "MZ", label: "Mozambique", dialCode: "+258" },
  { value: "MM", label: "Myanmar", dialCode: "+95" },
  { value: "NA", label: "Namibia", dialCode: "+264" },
  { value: "NR", label: "Nauru", dialCode: "+674" },
  { value: "NP", label: "Nepal", dialCode: "+977" },
  { value: "NL", label: "Netherlands", dialCode: "+31" },
  { value: "NZ", label: "New Zealand", dialCode: "+64" },
  { value: "NI", label: "Nicaragua", dialCode: "+505" },
  { value: "NE", label: "Niger", dialCode: "+227" },
  { value: "NG", label: "Nigeria", dialCode: "+234" },
  { value: "NU", label: "Niue", dialCode: "+683" },
  { value: "NO", label: "Norway", dialCode: "+47" },
  { value: "OM", label: "Oman", dialCode: "+968" },
  { value: "PK", label: "Pakistan", dialCode: "+92" },
  { value: "PW", label: "Palau", dialCode: "+680" },
  { value: "PS", label: "Palestine", dialCode: "+970" },
  { value: "PA", label: "Panama", dialCode: "+507" },
  { value: "PG", label: "Papua New Guinea", dialCode: "+675" },
  { value: "PY", label: "Paraguay", dialCode: "+595" },
  { value: "PE", label: "Peru", dialCode: "+51" },
  { value: "PH", label: "Philippines", dialCode: "+63" },
  { value: "PL", label: "Poland", dialCode: "+48" },
  { value: "PT", label: "Portugal", dialCode: "+351" },
  { value: "QA", label: "Qatar", dialCode: "+974" },
  { value: "RE", label: "Réunion", dialCode: "+262" },
  { value: "RO", label: "Romania", dialCode: "+40" },
  { value: "RU", label: "Russia", dialCode: "+7" },
  { value: "RW", label: "Rwanda", dialCode: "+250" },
  { value: "KN", label: "Saint Kitts and Nevis", dialCode: "+1" },
  { value: "LC", label: "Saint Lucia", dialCode: "+1" },
  { value: "VC", label: "Saint Vincent and the Grenadines", dialCode: "+1" },
  { value: "WS", label: "Samoa", dialCode: "+685" },
  { value: "SM", label: "San Marino", dialCode: "+378" },
  { value: "ST", label: "São Tomé and Príncipe", dialCode: "+239" },
  { value: "SA", label: "Saudi Arabia", dialCode: "+966" },
  { value: "SN", label: "Senegal", dialCode: "+221" },
  { value: "RS", label: "Serbia", dialCode: "+381" },
  { value: "SC", label: "Seychelles", dialCode: "+248" },
  { value: "SL", label: "Sierra Leone", dialCode: "+232" },
  { value: "SG", label: "Singapore", dialCode: "+65" },
  { value: "SK", label: "Slovakia", dialCode: "+421" },
  { value: "SI", label: "Slovenia", dialCode: "+386" },
  { value: "SB", label: "Solomon Islands", dialCode: "+677" },
  { value: "SO", label: "Somalia", dialCode: "+252" },
  { value: "ZA", label: "South Africa", dialCode: "+27" },
  { value: "SS", label: "South Sudan", dialCode: "+211" },
  { value: "ES", label: "Spain", dialCode: "+34" },
  { value: "LK", label: "Sri Lanka", dialCode: "+94" },
  { value: "SD", label: "Sudan", dialCode: "+249" },
  { value: "SR", label: "Suriname", dialCode: "+597" },
  { value: "SE", label: "Sweden", dialCode: "+46" },
  { value: "CH", label: "Switzerland", dialCode: "+41" },
  { value: "SY", label: "Syria", dialCode: "+963" },
  { value: "TW", label: "Taiwan", dialCode: "+886" },
  { value: "TJ", label: "Tajikistan", dialCode: "+992" },
  { value: "TZ", label: "Tanzania", dialCode: "+255" },
  { value: "TH", label: "Thailand", dialCode: "+66" },
  { value: "TL", label: "Timor-Leste", dialCode: "+670" },
  { value: "TG", label: "Togo", dialCode: "+228" },
  { value: "TO", label: "Tonga", dialCode: "+676" },
  { value: "TT", label: "Trinidad and Tobago", dialCode: "+1" },
  { value: "TN", label: "Tunisia", dialCode: "+216" },
  { value: "TR", label: "Turkey", dialCode: "+90" },
  { value: "TM", label: "Turkmenistan", dialCode: "+993" },
  { value: "TV", label: "Tuvalu", dialCode: "+688" },
  { value: "UG", label: "Uganda", dialCode: "+256" },
  { value: "UA", label: "Ukraine", dialCode: "+380" },
  { value: "AE", label: "United Arab Emirates", dialCode: "+971" },
  { value: "GB", label: "United Kingdom", dialCode: "+44" },
  { value: "US", label: "United States", dialCode: "+1" },
  { value: "UY", label: "Uruguay", dialCode: "+598" },
  { value: "UZ", label: "Uzbekistan", dialCode: "+998" },
  { value: "VU", label: "Vanuatu", dialCode: "+678" },
  { value: "VE", label: "Venezuela", dialCode: "+58" },
  { value: "VN", label: "Vietnam", dialCode: "+84" },
  { value: "YE", label: "Yemen", dialCode: "+967" },
  { value: "ZM", label: "Zambia", dialCode: "+260" },
  { value: "ZW", label: "Zimbabwe", dialCode: "+263" },
];

const INITIAL_FORM: AdminAccessFormData = {
  fullName: "",
  organizationalEmail: "",
  jobTitle: "",
  phoneCountry: "IN",
  phoneNumber: "",
  organizationName: "",
  organizationWebsite: "",
  industry: "",
  organizationSize: "",
  country: "",
  linkedInProfile: "",
  reasonForAccess: "",
  organizationalIdFile: null,
  infoAccurate: false,
  orgAuthorizationConfirmed: false,
  verificationConsent: false,
};

const STEPS: Array<{ step: Step; title: string; icon: typeof User }> = [
  { step: 1, title: "Personal Information", icon: User },
  { step: 2, title: "Organization Verification", icon: Building2 },
  { step: 3, title: "Professional Verification", icon: FileCheck },
  { step: 4, title: "Confirmation", icon: ShieldCheck },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AdminAccessRequestModal = ({
  open,
  onOpenChange,
}: AdminAccessRequestModalProps) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [form, setForm] = useState<AdminAccessFormData>({ ...INITIAL_FORM });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submissionSummary, setSubmissionSummary] = useState<{
    status: "pending" | "approved" | "hold" | "rejected";
    score: number;
  } | null>(null);

  const currentStepTitle = useMemo(
    () => STEPS.find((item) => item.step === currentStep)?.title ?? "",
    [currentStep],
  );

  const selectedDialCode = useMemo(
    () => PHONE_DIAL_CODE_OPTIONS.find((option) => option.value === form.phoneCountry)?.dialCode ?? "+",
    [form.phoneCountry],
  );

  const setField = <K extends keyof AdminAccessFormData>(
    field: K,
    value: AdminAccessFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateCurrentStep = (): boolean => {
    const nextErrors: FormErrors = {};

    if (currentStep === 1) {
      if (!form.fullName.trim()) nextErrors.fullName = "Full Name is required.";
      if (!form.organizationalEmail.trim()) {
        nextErrors.organizationalEmail = "Organizational Email is required.";
      } else if (!EMAIL_REGEX.test(form.organizationalEmail)) {
        nextErrors.organizationalEmail = "Enter a valid organizational email address.";
      }
    }

    if (currentStep === 2) {
      if (!form.organizationName.trim()) {
        nextErrors.organizationName = "Organization Name is required.";
      }
    }

    if (currentStep === 3) {
      if (!form.organizationalIdFile) {
        nextErrors.organizationalIdFile = "Organizational ID upload is required.";
      }
    }

    if (currentStep === 4) {
      if (!form.infoAccurate) {
        nextErrors.infoAccurate = "Please confirm information accuracy.";
      }
      if (!form.orgAuthorizationConfirmed) {
        nextErrors.orgAuthorizationConfirmed = "Please confirm organizational authorization.";
      }
      if (!form.verificationConsent) {
        nextErrors.verificationConsent = "Please provide consent to verification checks.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 4) as Step);
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateCurrentStep()) return;

    setSubmitError("");
    setIsSubmitting(true);

    const result = await submitAccessRequest({
      fullName: form.fullName,
      email: form.organizationalEmail,
      organization: form.organizationName,
      linkedinUrl: form.linkedInProfile,
      reasonForAccess: form.reasonForAccess,
      organizationDocument: form.organizationalIdFile as File,
    });

    if (!result.success) {
      setSubmitError(result.error || "Unable to submit access request. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setSubmissionSummary({
      status: result.status ?? "pending",
      score: result.score ?? 0,
    });
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const resetState = () => {
    setCurrentStep(1);
    setForm({ ...INITIAL_FORM });
    setErrors({});
    setIsSubmitting(false);
    setSubmitted(false);
    setSubmitError("");
    setSubmissionSummary(null);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetState();
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto border-slate-200 bg-gradient-to-b from-white via-slate-50/60 to-white">
        {submitted ? (
          <div className="py-8 px-2 text-center space-y-5 animate-fade-in">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 ring-8 ring-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <DialogHeader className="items-center space-y-2">
              <DialogTitle className="text-2xl font-heading">Access Request Submitted</DialogTitle>
              <DialogDescription className="text-sm text-slate-600 max-w-lg">
                Your institutional access request has been recorded and processed through automated validation.
              </DialogDescription>
            </DialogHeader>
            <div className="mx-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-600 space-y-2">
              <p className="font-semibold text-foreground">Future-compatible request payload</p>
              <p>Integrated with request scoring, auto-approval workflow, and admin dashboard review compatibility.</p>
              {submissionSummary ? (
                <p>
                  Current status: <span className="font-semibold uppercase">{submissionSummary.status}</span>
                  {" · "}Score: <span className="font-semibold">{submissionSummary.score}</span>
                </p>
              ) : null}
            </div>
            <Button className="gold-gradient text-accent-foreground" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-heading">Request Institutional Access</DialogTitle>
              <DialogDescription className="text-slate-600">
                Submit your organization-verified profile to request platform access.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-slate-200 bg-white/90 px-4 py-4">
              <div className="flex flex-wrap items-center gap-3">
                {STEPS.map((item, index) => {
                  const isDone = item.step < currentStep;
                  const isActive = item.step === currentStep;

                  return (
                    <div key={item.step} className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`h-8 w-8 rounded-full border flex items-center justify-center ${isDone
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : isActive
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-slate-300 bg-white text-slate-400"
                            }`}
                        >
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span
                          className={`text-xs sm:text-sm ${isActive ? "text-foreground font-medium" : "text-slate-500"
                            }`}
                        >
                          {item.title}
                        </span>
                      </div>
                      {index < STEPS.length - 1 ? (
                        <div className="hidden md:block h-px w-8 bg-slate-200" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-slate-500">Step {currentStep} of 4 · {currentStepTitle}</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {currentStep === 1 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={(e) => setField("fullName", e.target.value)}
                      placeholder="e.g., Dr. Sarah Chen"
                      aria-invalid={!!errors.fullName}
                    />
                    {errors.fullName ? <p className="text-xs text-destructive">{errors.fullName}</p> : null}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="organizationalEmail">Organizational Email *</Label>
                    <Input
                      id="organizationalEmail"
                      type="email"
                      value={form.organizationalEmail}
                      onChange={(e) => setField("organizationalEmail", e.target.value)}
                      placeholder="name@institution.edu"
                      aria-invalid={!!errors.organizationalEmail}
                    />
                    <p className="text-xs text-slate-500">No personal emails preferred.</p>
                    {errors.organizationalEmail ? <p className="text-xs text-destructive">{errors.organizationalEmail}</p> : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="jobTitle">Job Title / Role</Label>
                    <Input
                      id="jobTitle"
                      value={form.jobTitle}
                      onChange={(e) => setField("jobTitle", e.target.value)}
                      placeholder="Faculty Coordinator"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phoneNumber">Phone Number (optional)</Label>
                    <div className="flex gap-2">
                      <Select value={form.phoneCountry} onValueChange={(value) => setField("phoneCountry", value)}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Country" />
                        </SelectTrigger>
                        <SelectContent>
                          {PHONE_DIAL_CODE_OPTIONS.map((option) => (
                            <SelectItem value={option.value} key={option.value}>
                              {option.label} ({option.dialCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        autoComplete="tel-national"
                        value={form.phoneNumber}
                        onChange={(e) => setField("phoneNumber", e.target.value)}
                        placeholder={`${selectedDialCode} 98765 43210`}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="organizationName">Organization Name *</Label>
                    <Input
                      id="organizationName"
                      value={form.organizationName}
                      onChange={(e) => setField("organizationName", e.target.value)}
                      placeholder="Institution / Company name"
                      aria-invalid={!!errors.organizationName}
                    />
                    {errors.organizationName ? <p className="text-xs text-destructive">{errors.organizationName}</p> : null}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="organizationWebsite">Organization Website URL</Label>
                    <Input
                      id="organizationWebsite"
                      type="url"
                      value={form.organizationWebsite}
                      onChange={(e) => setField("organizationWebsite", e.target.value)}
                      placeholder="https://www.organization.org"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Industry</Label>
                    <Select value={form.industry} onValueChange={(value) => setField("industry", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_OPTIONS.map((option) => (
                          <SelectItem value={option} key={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Organization Size</Label>
                    <Select value={form.organizationSize} onValueChange={(value) => setField("organizationSize", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORG_SIZE_OPTIONS.map((option) => (
                          <SelectItem value={option} key={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Country / Location</Label>
                    <Select value={form.country} onValueChange={(value) => setField("country", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country or region" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_OPTIONS.map((option) => (
                          <SelectItem value={option} key={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="linkedInProfile">LinkedIn Profile Link (optional)</Label>
                    <Input
                      id="linkedInProfile"
                      type="url"
                      value={form.linkedInProfile}
                      onChange={(e) => setField("linkedInProfile", e.target.value)}
                      placeholder="https://linkedin.com/in/your-profile"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="organizationalIdFile">Organizational ID Upload *</Label>
                    <Input
                      id="organizationalIdFile"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setField("organizationalIdFile", e.target.files?.[0] ?? null)}
                      aria-invalid={!!errors.organizationalIdFile}
                    />
                    <p className="text-xs text-slate-500">Allowed formats: PDF / PNG / JPG.</p>
                    {form.organizationalIdFile ? (
                      <p className="text-xs text-foreground">Selected file: {form.organizationalIdFile.name}</p>
                    ) : null}
                    {errors.organizationalIdFile ? <p className="text-xs text-destructive">{errors.organizationalIdFile}</p> : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reasonForAccess">Reason for Access</Label>
                    <Textarea
                      id="reasonForAccess"
                      rows={4}
                      value={form.reasonForAccess}
                      onChange={(e) => setField("reasonForAccess", e.target.value)}
                      placeholder="Describe your intended use case and the team or department scope."
                    />
                  </div>
                </div>
              ) : null}

              {currentStep === 4 ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 space-y-2">
                    <p className="font-semibold text-foreground">Confirmation</p>
                    <p>
                      Review your information and confirm declarations before submitting your access request.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          id="infoAccurate"
                          checked={form.infoAccurate}
                          onCheckedChange={(checked) => setField("infoAccurate", Boolean(checked))}
                        />
                        <Label htmlFor="infoAccurate" className="text-sm leading-snug">
                          Information is accurate.
                        </Label>
                      </div>
                      {errors.infoAccurate ? <p className="text-xs text-destructive">{errors.infoAccurate}</p> : null}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          id="orgAuthorizationConfirmed"
                          checked={form.orgAuthorizationConfirmed}
                          onCheckedChange={(checked) => setField("orgAuthorizationConfirmed", Boolean(checked))}
                        />
                        <Label htmlFor="orgAuthorizationConfirmed" className="text-sm leading-snug">
                          Organization authorization confirmed.
                        </Label>
                      </div>
                      {errors.orgAuthorizationConfirmed ? (
                        <p className="text-xs text-destructive">{errors.orgAuthorizationConfirmed}</p>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          id="verificationConsent"
                          checked={form.verificationConsent}
                          onCheckedChange={(checked) => setField("verificationConsent", Boolean(checked))}
                        />
                        <Label htmlFor="verificationConsent" className="text-sm leading-snug">
                          Consent to verification checks.
                        </Label>
                      </div>
                      {errors.verificationConsent ? <p className="text-xs text-destructive">{errors.verificationConsent}</p> : null}
                    </div>
                  </div>

                  {submitError ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {submitError}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <DialogFooter className="pt-2 flex-col-reverse sm:flex-row sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  {currentStep > 1 ? (
                    <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
                      Back
                    </Button>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  {currentStep < 4 ? (
                    <Button type="button" className="gold-gradient text-accent-foreground" onClick={handleNext}>
                      Next Step
                    </Button>
                  ) : (
                    <Button type="submit" className="gold-gradient text-accent-foreground gap-2" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Submit Access Request
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminAccessRequestModal;
