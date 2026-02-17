import blobLogo from "@/assets/blob.png";
import blobLogoAlt from "@/assets/blob (1).png";
import channelLogo from "@/assets/channels4_profile.jpg";
import channelLogoAlt from "@/assets/channels4_profile (1).jpg";
import downloadLogo from "@/assets/download.png";
import imageLogo from "@/assets/images.png";
import imageLogoAlt from "@/assets/images (1).png";
import imageLogoAlt2 from "@/assets/images (2).png";
import imageLogoJpeg from "@/assets/images.jpeg";

const institutionLogos = [
  { src: blobLogo, alt: "Partner institution logo from CertifyPro assets" },
  { src: blobLogoAlt, alt: "Partner organization logo variant from CertifyPro assets" },
  { src: channelLogo, alt: "Institution profile logo from CertifyPro assets" },
  { src: channelLogoAlt, alt: "Institution profile logo variant from CertifyPro assets" },
  { src: downloadLogo, alt: "Organization logo from CertifyPro assets" },
  { src: imageLogo, alt: "Institution brand mark from CertifyPro assets" },
  { src: imageLogoAlt, alt: "Institution brand mark variant from CertifyPro assets" },
  { src: imageLogoAlt2, alt: "Organization symbol from CertifyPro assets" },
  { src: imageLogoJpeg, alt: "Institution emblem from CertifyPro assets" },
];

export function TrustedInstitutionsSection() {
  return (
    <section className="space-y-4 md:space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
          Trusted by Institutions &amp; Organizations
        </h2>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
          CertifyPro is adopted by education and training teams to standardize certificate issuance and verification workflows.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-5 md:gap-x-8 md:gap-y-6 items-center justify-items-center py-1">
        {institutionLogos.map((logo, index) => (
          <img
            key={`${logo.src}-${index}`}
            src={logo.src}
            alt={logo.alt}
            loading="lazy"
            className="h-10 sm:h-11 md:h-12 w-auto max-w-[140px] object-contain opacity-65 grayscale transition-all duration-300 ease-out hover:opacity-100 hover:grayscale-0"
          />
        ))}
      </div>
    </section>
  );
}
