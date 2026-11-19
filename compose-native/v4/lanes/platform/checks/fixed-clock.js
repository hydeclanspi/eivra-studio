// Test realm only. Compare fitted_at as well as generated_at, rather than dropping timestamps.
{ const RealDate=Date, at=RealDate.parse('2026-11-09T12:34:56.789Z'); globalThis.Date=class extends RealDate { constructor(...args){super(...(args.length?args:[at]))} static now(){return at} }; }
