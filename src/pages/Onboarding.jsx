import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';
import { StepBusiness } from './onboarding/StepBusiness';
import { StepWorkStyle } from './onboarding/StepWorkStyle';
import { StepTeam } from './onboarding/StepTeam';
import { StepCrews } from './onboarding/StepCrews';
import { StepServices } from './onboarding/StepServices';
import { StepReview } from './onboarding/StepReview';

const initialData = {
  company: '',
  phone: '',
  email: '',
  serviceArea: '',
  address: '',
  industry: '',
  teamSize: '',
  workStyle: 'solo',
  members: [],
  crews: [],
  services: [{ name: '', duration: '' }],
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(initialData);
  const [index, setIndex] = useState(0);

  const update = (patch) => setData((prev) => ({ ...prev, ...patch }));

  // The crew step only applies when the company works in crews.
  const flow = useMemo(
    () => [
      'business',
      'workStyle',
      'team',
      ...(data.workStyle === 'crew' ? ['crews'] : []),
      'services',
      'review',
    ],
    [data.workStyle],
  );

  const step = flow[Math.min(index, flow.length - 1)];
  const onBack = () => setIndex((i) => Math.max(0, i - 1));
  const onNext = () => setIndex((i) => Math.min(flow.length - 1, i + 1));

  const props = { data, update, onBack, onNext };

  switch (step) {
    case 'workStyle':
      return <StepWorkStyle {...props} />;
    case 'team':
      return <StepTeam {...props} />;
    case 'crews':
      return <StepCrews {...props} />;
    case 'services':
      return <StepServices {...props} />;
    case 'review':
      return <StepReview {...props} onNext={() => navigate('/')} />;
    default:
      return <StepBusiness {...props} />;
  }
};

export default Onboarding;
