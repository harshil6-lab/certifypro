import blobLogo from "@/assets/blob.png";
import blobLogoAlt from "@/assets/blob (1).png";
import channelLogo from "@/assets/channels4_profile.jpg";
import channelLogoAlt from "@/assets/channels4_profile (1).jpg";
import courseheroLogo from "@/assets/coursehero_logo-2.png";
import downloadLogo from "@/assets/download.png";
import imageLogo from "@/assets/images.png";
import imageLogoAlt from "@/assets/images (1).png";
import imageLogoAlt2 from "@/assets/images (2).png";
import imageLogoAlt3 from "@/assets/images (3).png";
import imageLogoAlt4 from "@/assets/images (4).png";
import imageLogoJpeg from "@/assets/images.jpeg";

const institutionLogos = [
  { src: blobLogo, alt: "Partner institution logo from CertifyPro assets" },
  { src: blobLogoAlt, alt: "Partner organization logo variant from CertifyPro assets" },
  { src: channelLogo, alt: "Institution profile logo from CertifyPro assets" },
  { src: channelLogoAlt, alt: "Institution profile logo variant from CertifyPro assets" },
  { src: courseheroLogo, alt: "Course provider logo from CertifyPro assets" },
  { src: downloadLogo, alt: "Organization logo from CertifyPro assets" },
  { src: imageLogo, alt: "Institution brand mark from CertifyPro assets" },
  { src: imageLogoAlt, alt: "Institution brand mark variant from CertifyPro assets" },
  { src: imageLogoAlt2, alt: "Organization symbol from CertifyPro assets" },
  { src: imageLogoAlt3, alt: "Institution identity logo from CertifyPro assets" },
  { src: imageLogoAlt4, alt: "Partner logo mark from CertifyPro assets" },
  { src: imageLogoJpeg, alt: "Institution emblem from CertifyPro assets" },
];

export function TrustedInstitutionsSection() {
  return (
    <section className="space-y-4 md:space-y-5 w-full animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
          Trusted by Institutions &amp; Organizations
        </h2>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
          CertifyPro is adopted by education and training teams to standardize certificate issuance and verification workflows.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-7 items-center justify-items-center py-2 sm:py-3">
        {institutionLogos.map((logo, index) => (
          <div
            key={`${logo.src}-${index}`}
            className="group relative rounded-xl px-3 py-2 transition-all duration-300 ease-out hover:scale-105"
          >
            <div className="absolute inset-0 rounded-xl bg-white/0 opacity-0 backdrop-blur-none shadow-none transition-all duration-300 group-hover:bg-white/10 group-hover:opacity-100 group-hover:backdrop-blur-[1.5px] group-hover:shadow-[0_10px_22px_rgba(15,23,42,0.12)] dark:group-hover:bg-white/5" />
            <img
              src={logo.src}
              alt={logo.alt}
              loading="lazy"
              className="relative z-10 h-14 sm:h-14 md:h-14 w-auto max-w-[170px] object-contain opacity-100 transition-all duration-300 group-hover:opacity-100"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
