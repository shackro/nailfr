const localImageByUnsplashId: Record<string, string> = {
  'photo-1604654894610-df63bc536371': '/images/portfolio-chrome-ombre.jpg',
  'photo-1632345031435-8727f6897d53': '/images/portfolio-french-tips.jpg',
  'photo-1519014816548-bf5fe059798b': '/images/portfolio-floral-acrylics.jpg',
  'photo-1522337660859-02fbefca4702': '/images/portfolio-nude-gel.jpg',
  'photo-1604654894611-6973b376cbde': '/images/portfolio-gel-overlay.jpg',
  'photo-1519415943484-9fa1873496d4': '/images/self-care-spa.jpg',
  'photo-1522337360788-8b13dee7a37e': '/images/event-masterclass.jpg',
};

export function resolveImageSource(source: string): string {
  const unsplashId = Object.keys(localImageByUnsplashId).find((id) => source.includes(id));
  return unsplashId ? localImageByUnsplashId[unsplashId] : source;
}
