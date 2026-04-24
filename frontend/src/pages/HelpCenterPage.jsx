import React, { useState } from 'react';
import { FiHelpCircle, FiBook, FiChevronDown, FiChevronRight, FiSearch, FiCpu, FiDatabase, FiCloud, FiKey, FiUsers, FiDollarSign, FiAlertCircle, FiCommand, FiMail } from 'react-icons/fi';

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <FiBook />,
    content: `Welcome to the AI Fine-Tuning Platform! This platform allows you to fine-tune large language models on your own data.\n\n**First Steps:**\n\n1. **Create a Dataset** - Navigate to Datasets and upload your training data in JSONL, CSV, or Parquet format.\n2. **Choose a Base Model** - Browse available base models under the Models section.\n3. **Configure Training** - Set up training parameters like learning rate, epochs, and batch size.\n4. **Start a Fine-Tuning Job** - Launch your job and monitor progress in real-time.\n5. **Evaluate & Deploy** - Review metrics, compare models, and deploy the best one.\n\nThe Dashboard gives you a quick overview of all your resources and recent activity.`
  },
  {
    id: 'fine-tuning',
    title: 'Fine-Tuning Guide',
    icon: <FiCpu />,
    content: `Fine-tuning allows you to customize a base model with your own training data.\n\n**Creating a Fine-Tuning Job:**\n\n1. Go to Fine-Tuning Jobs and click "New Job".\n2. Select a base model (e.g., GPT-4, LLaMA, Mistral).\n3. Choose your training dataset.\n4. Configure hyperparameters:\n   - **Learning Rate**: Start with 1e-5 for most tasks.\n   - **Epochs**: 3-5 epochs is usually sufficient.\n   - **Batch Size**: 8-32 depending on model size and GPU memory.\n   - **LoRA Rank**: 8-64 for parameter-efficient fine-tuning.\n5. Click "Start Training" and monitor the job.\n\n**Tips:**\n- Use smaller learning rates for larger models.\n- More data generally leads to better results.\n- Monitor validation loss to avoid overfitting.\n- Use early stopping if validation loss starts increasing.`
  },
  {
    id: 'datasets',
    title: 'Dataset Management',
    icon: <FiDatabase />,
    content: `Datasets are the foundation of fine-tuning.\n\n**Supported Formats:**\n- **JSONL**: One JSON object per line with "prompt" and "completion" fields.\n- **CSV**: Columns for input and output text.\n- **Parquet**: Efficient columnar format for large datasets.\n- **JSON**: Standard JSON array of objects.\n\n**Best Practices:**\n- Aim for at least 100 high-quality examples.\n- Ensure consistent formatting across all samples.\n- Include diverse examples covering edge cases.\n- Remove duplicates and low-quality entries.\n- Validate your dataset before training.\n\n**Data Pipelines:**\nUse Data Pipelines to automate data preprocessing, cleaning, and transformation steps.`
  },
  {
    id: 'deployment',
    title: 'Model Deployment',
    icon: <FiCloud />,
    content: `Deploy your fine-tuned models to make them available via API.\n\n**Deployment Steps:**\n\n1. Navigate to Deployments and click "New Deployment".\n2. Select the fine-tuned model to deploy.\n3. Choose the environment (development, staging, production).\n4. Configure scaling settings (min/max replicas, auto-scaling).\n5. Click "Deploy" and wait for the deployment to become active.\n\n**Environments:**\n- **Development**: For testing, lower resources.\n- **Staging**: Pre-production validation.\n- **Production**: Live traffic, high availability.\n\n**Monitoring:**\nTrack request latency, throughput, and error rates from the deployment detail page.`
  },
  {
    id: 'api-keys',
    title: 'API Keys & Authentication',
    icon: <FiKey />,
    content: `API keys allow you to access the platform programmatically.\n\n**Creating an API Key:**\n\n1. Go to API Keys and click "Create Key".\n2. Give the key a descriptive name.\n3. Set appropriate permissions (read, write, admin).\n4. Copy the key immediately - it will only be shown once.\n\n**Using API Keys:**\nInclude the key in request headers:\n\nAuthorization: Bearer YOUR_API_KEY\n\n**Security Best Practices:**\n- Never share API keys in code repositories.\n- Rotate keys regularly.\n- Use the minimum required permissions.\n- Revoke unused keys promptly.`
  },
  {
    id: 'team',
    title: 'Team Management',
    icon: <FiUsers />,
    content: `Collaborate with your team on the platform.\n\n**Roles:**\n- **Admin**: Full access to all features including settings and team management.\n- **Manager**: Can create and manage resources, but cannot modify system settings.\n- **Member**: Can view resources and run jobs, but cannot delete or modify team settings.\n- **Viewer**: Read-only access to all resources.\n\n**Inviting Members:**\n\n1. Go to Team Members and click "Invite Member".\n2. Enter the email address.\n3. Select the appropriate role.\n4. The invited user will receive an email with login instructions.\n\n**Managing Members:**\nAdmins can change roles, deactivate accounts, and remove team members.`
  },
  {
    id: 'billing',
    title: 'Billing & Usage',
    icon: <FiDollarSign />,
    content: `Track your platform usage and associated costs.\n\n**Usage Tracking:**\n- **Training Costs**: Based on GPU hours used for fine-tuning jobs.\n- **Inference Costs**: Based on API calls to deployed models.\n- **Storage Costs**: Based on dataset and model storage.\n\n**Understanding Your Bill:**\n- View detailed breakdowns in the Usage & Billing section.\n- Filter by date range, resource type, or team member.\n- Export billing data for accounting purposes.\n\n**Cost Optimization:**\n- Use smaller models when possible.\n- Clean up unused deployments.\n- Archive old datasets and models.\n- Use spot instances for non-critical training jobs.`
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: <FiAlertCircle />,
    content: `Common issues and their solutions.\n\n**Training Job Failed:**\n- Check the job logs for error messages.\n- Verify dataset format is correct.\n- Ensure sufficient GPU memory for the model size.\n- Try reducing batch size or model size.\n\n**Deployment Not Responding:**\n- Check deployment status and logs.\n- Verify the model loaded correctly.\n- Check resource limits and scaling settings.\n- Restart the deployment if needed.\n\n**API Key Not Working:**\n- Verify the key is active and not expired.\n- Check that permissions match the required operation.\n- Ensure the Authorization header format is correct.\n\n**Slow Training:**\n- Use a larger batch size if GPU memory allows.\n- Check for data loading bottlenecks.\n- Consider using a training config with optimized settings.`
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    icon: <FiCommand />,
    content: `Useful keyboard shortcuts for faster navigation.\n\n**Global:**\n- Ctrl/Cmd + K: Open global search\n- Ctrl/Cmd + /: Open help center\n- Escape: Close modals and dialogs\n\n**Navigation:**\n- G then D: Go to Dashboard\n- G then J: Go to Fine-Tuning Jobs\n- G then M: Go to Models\n- G then S: Go to Datasets\n- G then P: Go to Deployments\n\n**Actions:**\n- N: Create new resource (on list pages)\n- E: Edit selected resource\n- Delete: Delete selected resource (with confirmation)\n- Ctrl/Cmd + S: Save current form`
  },
  {
    id: 'contact',
    title: 'Contact Support',
    icon: <FiMail />,
    content: `Need help? Reach out to our support team.\n\n**Email Support:**\nsupport@aifinetuning.io\n\n**Response Times:**\n- Critical issues: Within 1 hour\n- General questions: Within 24 hours\n- Feature requests: Reviewed weekly\n\n**When Contacting Support:**\nPlease include:\n- Your account email\n- A description of the issue\n- Steps to reproduce the problem\n- Any relevant error messages or screenshots\n- The resource ID (job, model, dataset) if applicable\n\n**Documentation:**\nVisit our full documentation at docs.aifinetuning.io for detailed API references and guides.`
  },
];

export default function HelpCenterPage() {
  const [expandedSections, setExpandedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = sections.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Help Center</h1>
          <p className="page-subtitle">Documentation and guides for the platform</p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', position: 'relative' }}>
        <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#a0a0b8' }} />
        <input
          className="form-input"
          style={{ paddingLeft: '2.75rem' }}
          placeholder="Search help topics..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FiHelpCircle /></div>
          <div className="empty-state-text">No matching topics found</div>
          <div className="empty-state-sub">Try a different search term</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(section => {
            const isExpanded = expandedSections[section.id];
            return (
              <div className="card" key={section.id}>
                <div
                  onClick={() => toggleSection(section.id)}
                  style={{
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ color: '#6c63ff', fontSize: '1.25rem', display: 'flex' }}>{section.icon}</span>
                  <span style={{ flex: 1, fontWeight: 600, color: '#e0e0ff', fontSize: '1.05rem' }}>{section.title}</span>
                  <span style={{ color: '#a0a0b8', display: 'flex', fontSize: '1.1rem' }}>
                    {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                  </span>
                </div>
                {isExpanded && (
                  <div style={{
                    padding: '0 1.5rem 1.5rem 3.5rem',
                    color: '#c0c0e0',
                    fontSize: '0.92rem',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-line'
                  }}>
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
