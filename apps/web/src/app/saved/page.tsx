import { SavedGallery } from "@/components/saved/saved-gallery";

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-shell px-5 py-14 lg:px-8 lg:py-20">
      <p className="font-sans text-xs font-bold uppercase text-primary">
        Saved
      </p>
      <h1 className="mt-3 font-serif text-5xl leading-none">
        Pairs worth revisiting
      </h1>
      <SavedGallery />
    </div>
  );
}
