import DashboardModel from '../models/DashboardModel';

class DashboardPresenter {
  constructor(view) {
    this.view = view;
    this.model = new DashboardModel();
  }

  async loadDashboardData() {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      // Fetch all dashboard data in parallel
      const [
        stats,
        ibuByKelurahan,
        ageDistribution,
        ancPerMonth,
        immunizationCoverage,
        riskDistribution,
        nearingDueDates
      ] = await Promise.all([
        this.model.getDashboardStats(),
        this.model.getIbuByKelurahan(),
        this.model.getAgeDistribution(),
        this.model.getANCPerMonth(),
        this.model.getImmunizationCoverage(),
        this.model.getRiskDistribution(),
        this.model.getNearingDueDates()
      ]);

      this.view.displayStats(stats);
      this.view.displayIbuByKelurahan(ibuByKelurahan);
      this.view.displayAgeDistribution(ageDistribution);
      this.view.displayANCPerMonth(ancPerMonth);
      this.view.displayImmunizationCoverage(immunizationCoverage);
      this.view.displayRiskDistribution(riskDistribution);
      this.view.displayNearingDueDates(nearingDueDates);

    } catch (error) {
      this.view.setError(error.message || 'Failed to load dashboard data');
    } finally {
      this.view.setLoading(false);
    }
  }

  handleLogout() {
    this.view.onLogout();
  }

  handleRefresh() {
    this.loadDashboardData();
  }
}

export default DashboardPresenter;
