import { GalleryCategory } from "@/components/certificates/types";
import { CategoryCube3D } from "@/components/landing/CategoryCube3D";

const categoryOrder: ("All" | GalleryCategory)[] = ["All", "Academic", "Corporate", "Internship", "Event", "Compliance", "Training"];

export function CertificateGallerySection() {
  return (
    <section className="space-y-7 bg-white p-5 sm:p-6 rounded-2xl">
      <div className="space-y-2 max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-heading font-semibold tracking-tight text-foreground">
          Explore Certificate Templates
        </h2>
        <p className="text-slate-600 leading-relaxed">
          Professional templates designed for institutions, corporate training, and certification programs.
        </p>
      </div>

      <CategoryCube3D categories={categoryOrder} />
    </section>
  );
}
