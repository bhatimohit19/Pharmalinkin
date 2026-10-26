/* Release phase. 'onboarding' = candidate onboarding only. Set to 'full' to re-enable every module. */
(function () {
  const PL = (window.PL = window.PL || {});
  PL.config = {
    phase: 'onboarding',
    employerEnabled: true,
    socialLinks: [
      { label: 'Facebook', url: 'https://www.facebook.com/pharmalinkin/' },
      { label: 'Instagram', url: 'https://www.instagram.com/pharmalinkin/' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/company/pharmalinkinjobs' },
      { label: 'Twitter', url: 'https://twitter.com/pharmalinkin' }
    ],
    allowed: [/^\/$/, /^\/login$/, /^\/register$/, /^\/verify-account$/, /^\/registration-complete$/, /^\/forgot-password$/, /^\/forgot-username$/, /^\/job-search$/, /^\/dashboard$/, /^\/my-applications$/, /^\/saved-jobs$/, /^\/job-results$/, /^\/job\/[\w-]+$/, /^\/app\/(feed|messages|notifications|resume)$/, /^\/app\/profile(?:\/[\w-]+)*$/, /^\/reset-password$/, /^\/onboarding(\/done)?$/, /^\/employer\/(onboarding|dashboard|company|jobs|jobs\/new|jobs\/[\w-]+\/edit|applicants|applicants\/[\w-]+|interviews|messages|notifications)$/, /^\/companies\/[\w-]+$/, /^\/page\/[\w-]+$/]
  };
  PL.onboardingOnly = () => PL.config.phase === 'onboarding';
  PL.employerOn = () => !PL.onboardingOnly() || PL.config.employerEnabled;
  PL.isAllowed = path => !PL.onboardingOnly() || (PL.config.allowed.some(re => re.test(path)) && (PL.config.employerEnabled || !/^\/(employer|companies)/.test(path)));
})();
