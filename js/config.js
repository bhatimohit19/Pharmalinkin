/* Release phase. 'onboarding' = candidate onboarding only. Set to 'full' to re-enable every module. */
(function () {
  const PL = (window.PL = window.PL || {});
  PL.config = {
    phase: 'onboarding',
    allowed: [/^\/$/, /^\/login$/, /^\/register$/, /^\/verify-account$/, /^\/registration-complete$/, /^\/forgot-password$/, /^\/reset-password$/, /^\/onboarding(\/done)?$/, /^\/page\/[\w-]+$/]
  };
  PL.onboardingOnly = () => PL.config.phase === 'onboarding';
  PL.isAllowed = path => !PL.onboardingOnly() || PL.config.allowed.some(re => re.test(path));
})();
