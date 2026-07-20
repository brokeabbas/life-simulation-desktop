import { useGame } from '../store';
import { HealthFoodPanel } from './health-food';
import JobsPanel from './jobs/JobsPanel';
import BusinessDashboard from './business/BusinessDashboard';
import CategoryLifePanel from './CategoryLifePanel';
import EducationPanel from './education/EducationPanel';

export default function CategoryDetail() {
  const { selected } = useGame();

  if (selected === 'health_food') return <HealthFoodPanel />;
  if (selected === 'education') return <EducationPanel />;
  if (selected === 'job' || selected === 'career') return <JobsPanel />;
  if (selected === 'business') return <BusinessDashboard />;
  if (selected) return <CategoryLifePanel category={selected} />;

  return null;
}
