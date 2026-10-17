/* Release phase. 'onboarding' = candidate onboarding only. Set to 'full' to re-enable every module. */
(function () {
  const PL = (window.PL = window.PL || {});
  PL.config = {
    phase: 'onboarding',
    employerEnabled: false, // set true to re-open employer registration and workspace
    allowed: [/^\/$/, /^\/login$/, /^\/register$/, /^\/verify-account$/, /^\/registration-complete$/, /^\/forgot-password$/, /^\/reset-password$/, /^\/onboarding(\/done)?$/, /^\/employer\/(onboarding|dashboard|company|jobs|jobs\/new|jobs\/[\w-]+\/edit|applicants|applicants\/[\w-]+|interviews)$/, /^\/companies\/[\w-]+$/, /^\/page\/[\w-]+$/]
  };
  PL.onboardingOnly = () => PL.config.phase === 'onboarding';
  PL.employerOn = () => !PL.onboardingOnly() || PL.config.employerEnabled;
  PL.isAllowed = path => !PL.onboardingOnly() || (PL.config.allowed.some(re => re.test(path)) && (PL.config.employerEnabled || !/^\/(employer|companies)/.test(path)));
})();
