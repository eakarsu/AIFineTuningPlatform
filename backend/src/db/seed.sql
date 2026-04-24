-- Seed Data for AI Fine-Tuning Platform
-- Password hash is for 'admin123' - will be replaced by seed runner

-- Users (3 users)
INSERT INTO users (email, password_hash, name, role, company) VALUES
('admin@aifinetuning.com', '$2a$10$PLACEHOLDER_HASH_ADMIN', 'Alex Admin', 'admin', 'AI Platform Inc'),
('user@aifinetuning.com', '$2a$10$PLACEHOLDER_HASH_USER', 'Uma User', 'user', 'DataTech Labs'),
('viewer@aifinetuning.com', '$2a$10$PLACEHOLDER_HASH_VIEWER', 'Victor Viewer', 'viewer', 'ViewCorp')
ON CONFLICT (email) DO NOTHING;

-- Base Models (18 models)
INSERT INTO base_models (name, provider, description, parameters, context_length, category, capabilities, pricing_per_1k, is_available) VALUES
('GPT-4 Turbo', 'OpenAI', 'Most capable GPT-4 model with vision and 128k context', '1.76T', 128000, 'large-language-model', '["text-generation", "code-generation", "reasoning", "vision"]', 0.010000, true),
('GPT-4o', 'OpenAI', 'Optimized GPT-4 with faster inference', '1.76T', 128000, 'large-language-model', '["text-generation", "code-generation", "reasoning", "vision"]', 0.005000, true),
('GPT-3.5 Turbo', 'OpenAI', 'Fast and cost-effective for simpler tasks', '175B', 16385, 'large-language-model', '["text-generation", "code-generation", "chat"]', 0.000500, true),
('Claude 3.5 Sonnet', 'Anthropic', 'Balanced performance and speed from Anthropic', '?', 200000, 'large-language-model', '["text-generation", "code-generation", "reasoning", "analysis"]', 0.003000, true),
('Claude 3 Opus', 'Anthropic', 'Most capable Claude model for complex tasks', '?', 200000, 'large-language-model', '["text-generation", "code-generation", "reasoning", "analysis"]', 0.015000, true),
('Claude 3 Haiku', 'Anthropic', 'Fastest and most compact Claude model', '?', 200000, 'large-language-model', '["text-generation", "chat", "summarization"]', 0.000250, true),
('Llama 3.1 405B', 'Meta', 'Largest open-source Llama model', '405B', 131072, 'large-language-model', '["text-generation", "code-generation", "reasoning"]', 0.002000, true),
('Llama 3.1 70B', 'Meta', 'High-performance open-source model', '70B', 131072, 'large-language-model', '["text-generation", "code-generation", "reasoning"]', 0.000800, true),
('Llama 3.1 8B', 'Meta', 'Efficient small Llama model for fine-tuning', '8B', 131072, 'large-language-model', '["text-generation", "chat"]', 0.000100, true),
('Mistral Large', 'Mistral AI', 'Flagship Mistral model for complex tasks', '?', 128000, 'large-language-model', '["text-generation", "code-generation", "reasoning"]', 0.004000, true),
('Mistral 7B', 'Mistral AI', 'Efficient open-source model ideal for fine-tuning', '7B', 32768, 'large-language-model', '["text-generation", "chat"]', 0.000100, true),
('Mixtral 8x7B', 'Mistral AI', 'Mixture of experts model with great efficiency', '46.7B', 32768, 'large-language-model', '["text-generation", "code-generation"]', 0.000600, true),
('Gemini 1.5 Pro', 'Google', 'Advanced multimodal model from Google', '?', 2097152, 'large-language-model', '["text-generation", "vision", "reasoning", "code-generation"]', 0.003500, true),
('Gemini 1.5 Flash', 'Google', 'Fast and efficient Gemini variant', '?', 1048576, 'large-language-model', '["text-generation", "vision", "chat"]', 0.000075, true),
('CodeLlama 34B', 'Meta', 'Specialized code generation model', '34B', 16384, 'code-model', '["code-generation", "code-completion", "debugging"]', 0.000500, true),
('Phi-3 Medium', 'Microsoft', 'Compact but capable model from Microsoft', '14B', 128000, 'large-language-model', '["text-generation", "reasoning"]', 0.000200, true),
('Qwen 2 72B', 'Alibaba', 'Large multilingual model', '72B', 131072, 'large-language-model', '["text-generation", "multilingual", "code-generation"]', 0.000900, true),
('DBRX', 'Databricks', 'Open-source MoE model from Databricks', '132B', 32768, 'large-language-model', '["text-generation", "code-generation"]', 0.000750, true);

-- Training Datasets (18 datasets)
INSERT INTO training_datasets (name, description, file_format, num_samples, size_mb, category, status, schema_info, user_id) VALUES
('Customer Support Conversations', 'Annotated customer support chat logs for training support bots', 'jsonl', 50000, 245.50, 'conversational', 'ready', '{"fields": ["instruction", "input", "output"]}', 1),
('Medical Q&A Dataset', 'Medical questions and expert answers for healthcare AI', 'jsonl', 120000, 890.25, 'question-answering', 'ready', '{"fields": ["question", "answer", "category"]}', 1),
('Code Review Feedback', 'Code snippets with reviewer comments and suggestions', 'jsonl', 75000, 512.00, 'code', 'ready', '{"fields": ["code", "review", "severity"]}', 2),
('Legal Document Summaries', 'Legal documents paired with professional summaries', 'jsonl', 30000, 1200.75, 'summarization', 'ready', '{"fields": ["document", "summary", "jurisdiction"]}', 1),
('Product Description Generator', 'Products with marketing descriptions across categories', 'csv', 85000, 156.30, 'text-generation', 'ready', '{"fields": ["product_name", "features", "description"]}', 2),
('Sentiment Analysis Reviews', 'Customer reviews labeled with sentiment scores', 'jsonl', 200000, 340.00, 'classification', 'ready', '{"fields": ["text", "sentiment", "score"]}', 1),
('SQL Query Generation', 'Natural language to SQL query pairs', 'jsonl', 45000, 89.50, 'code', 'ready', '{"fields": ["natural_language", "sql_query", "database_schema"]}', 2),
('Multi-turn Dialogue', 'Extended conversational dialogues for chatbot training', 'jsonl', 60000, 780.00, 'conversational', 'ready', '{"fields": ["messages", "system_prompt"]}', 1),
('Scientific Paper Abstracts', 'Research papers with structured abstracts', 'jsonl', 150000, 2100.50, 'summarization', 'processing', '{"fields": ["paper_text", "abstract", "keywords"]}', 1),
('Translation EN-ES', 'English to Spanish translation pairs', 'jsonl', 500000, 1500.00, 'translation', 'ready', '{"fields": ["source", "target", "domain"]}', 2),
('Image Caption Dataset', 'Image descriptions for multimodal training', 'jsonl', 330000, 450.25, 'multimodal', 'ready', '{"fields": ["image_url", "caption", "alt_text"]}', 1),
('Financial News Analysis', 'Financial news articles with analysis and predictions', 'csv', 95000, 678.90, 'analysis', 'ready', '{"fields": ["headline", "article", "analysis", "sentiment"]}', 2),
('Instruction Following', 'Diverse instruction-response pairs for alignment', 'jsonl', 180000, 920.00, 'instruction-tuning', 'ready', '{"fields": ["instruction", "response", "quality_score"]}', 1),
('Bug Report Classification', 'Software bug reports categorized by type and priority', 'jsonl', 42000, 156.00, 'classification', 'ready', '{"fields": ["title", "description", "category", "priority"]}', 2),
('Creative Writing Prompts', 'Writing prompts with high-quality story completions', 'jsonl', 25000, 340.50, 'text-generation', 'ready', '{"fields": ["prompt", "story", "genre"]}', 1),
('API Documentation QA', 'Questions about APIs with documented answers', 'jsonl', 38000, 210.00, 'question-answering', 'processing', '{"fields": ["question", "answer", "api_name"]}', 2),
('Toxicity Detection', 'Text samples labeled for toxicity and hate speech', 'csv', 275000, 890.00, 'classification', 'ready', '{"fields": ["text", "is_toxic", "category", "severity"]}', 1),
('Resume Parser Training', 'Resumes with structured extracted information', 'jsonl', 55000, 430.75, 'extraction', 'ready', '{"fields": ["resume_text", "extracted_fields"]}', 2);

-- Fine-Tuning Jobs (18 jobs)
INSERT INTO fine_tuning_jobs (name, description, base_model, dataset_id, status, config, metrics, user_id, completed_at) VALUES
('Support Bot v1', 'Fine-tune for customer support automation', 'Llama 3.1 8B', 1, 'completed', '{"learning_rate": 0.0002, "epochs": 3, "batch_size": 8}', '{"loss": 0.42, "accuracy": 0.89, "f1": 0.87}', 1, NOW() - INTERVAL '2 days'),
('Medical QA Model', 'Healthcare question answering specialist', 'Mistral 7B', 2, 'completed', '{"learning_rate": 0.0001, "epochs": 5, "batch_size": 4}', '{"loss": 0.35, "accuracy": 0.92, "f1": 0.91}', 1, NOW() - INTERVAL '5 days'),
('Code Reviewer AI', 'Automated code review assistant', 'CodeLlama 34B', 3, 'running', '{"learning_rate": 0.00015, "epochs": 4, "batch_size": 8}', '{"loss": 0.55, "current_epoch": 2}', 2, NULL),
('Legal Summarizer', 'Legal document summarization model', 'Llama 3.1 70B', 4, 'completed', '{"learning_rate": 0.00005, "epochs": 3, "batch_size": 2}', '{"loss": 0.38, "rouge_l": 0.85, "bleu": 0.72}', 1, NOW() - INTERVAL '1 day'),
('Product Copywriter', 'Marketing description generator', 'GPT-3.5 Turbo', 5, 'queued', '{"learning_rate": 0.0002, "epochs": 3, "batch_size": 16}', NULL, 2, NULL),
('Sentiment Analyzer Pro', 'Advanced sentiment classification', 'Mistral 7B', 6, 'completed', '{"learning_rate": 0.0003, "epochs": 4, "batch_size": 32}', '{"loss": 0.28, "accuracy": 0.94, "f1": 0.93}', 1, NOW() - INTERVAL '10 days'),
('SQL Generator v2', 'Natural language to SQL conversion', 'CodeLlama 34B', 7, 'running', '{"learning_rate": 0.0001, "epochs": 5, "batch_size": 8}', '{"loss": 0.48, "current_epoch": 3}', 2, NULL),
('Chatbot Assistant', 'General purpose conversational AI', 'Llama 3.1 8B', 8, 'completed', '{"learning_rate": 0.0002, "epochs": 3, "batch_size": 8}', '{"loss": 0.40, "perplexity": 12.5}', 1, NOW() - INTERVAL '7 days'),
('Research Summarizer', 'Scientific paper summarization', 'Llama 3.1 70B', 9, 'failed', '{"learning_rate": 0.0001, "epochs": 5, "batch_size": 2}', '{"error": "OOM at epoch 3", "last_loss": 0.52}', 1, NULL),
('Translator EN-ES', 'English to Spanish translation model', 'Mistral 7B', 10, 'completed', '{"learning_rate": 0.0002, "epochs": 4, "batch_size": 16}', '{"loss": 0.31, "bleu": 0.82}', 2, NOW() - INTERVAL '3 days'),
('Caption Generator', 'Image captioning fine-tune', 'Llama 3.1 8B', 11, 'queued', '{"learning_rate": 0.0002, "epochs": 3, "batch_size": 8}', NULL, 1, NULL),
('Finance Analyst', 'Financial news analysis model', 'Mistral 7B', 12, 'running', '{"learning_rate": 0.00015, "epochs": 4, "batch_size": 8}', '{"loss": 0.50, "current_epoch": 1}', 2, NULL),
('Instruction Follower', 'Alignment fine-tuning for instruction following', 'Llama 3.1 70B', 13, 'completed', '{"learning_rate": 0.00005, "epochs": 2, "batch_size": 4}', '{"loss": 0.33, "accuracy": 0.91}', 1, NOW() - INTERVAL '14 days'),
('Bug Classifier', 'Software bug report classification', 'Phi-3 Medium', 14, 'completed', '{"learning_rate": 0.0003, "epochs": 5, "batch_size": 16}', '{"loss": 0.30, "accuracy": 0.93, "f1": 0.92}', 2, NOW() - INTERVAL '8 days'),
('Story Writer', 'Creative writing assistant', 'Llama 3.1 8B', 15, 'cancelled', '{"learning_rate": 0.0002, "epochs": 3, "batch_size": 8}', '{"loss": 0.60, "cancelled_at_epoch": 1}', 1, NULL),
('API Doc QA', 'API documentation question answering', 'Mistral 7B', 16, 'queued', '{"learning_rate": 0.0002, "epochs": 4, "batch_size": 8}', NULL, 2, NULL),
('Content Moderator', 'Toxicity and content moderation model', 'Llama 3.1 8B', 17, 'completed', '{"learning_rate": 0.0003, "epochs": 3, "batch_size": 32}', '{"loss": 0.25, "accuracy": 0.96, "f1": 0.95}', 1, NOW() - INTERVAL '4 days'),
('Resume Parser', 'Structured information extraction from resumes', 'Mistral 7B', 18, 'running', '{"learning_rate": 0.0002, "epochs": 4, "batch_size": 8}', '{"loss": 0.47, "current_epoch": 2}', 2, NULL);

-- Custom Models (18 models)
INSERT INTO custom_models (name, description, base_model_id, fine_tuning_job_id, version, status, performance_metrics, endpoint_url, user_id) VALUES
('SupportBot-v1.0', 'Customer support chatbot model', 1, 1, '1.0.0', 'deployed', '{"accuracy": 0.89, "latency_ms": 120, "throughput": 450}', 'https://api.platform.ai/v1/models/supportbot-v1', 1),
('MedQA-Expert', 'Medical question answering model', 11, 2, '1.0.0', 'ready', '{"accuracy": 0.92, "latency_ms": 200, "f1": 0.91}', NULL, 1),
('CodeReview-Alpha', 'Code review assistant (in training)', 15, 3, '0.1.0', 'training', NULL, NULL, 2),
('LegalSum-Pro', 'Legal document summarizer', 8, 4, '1.0.0', 'deployed', '{"rouge_l": 0.85, "bleu": 0.72, "latency_ms": 350}', 'https://api.platform.ai/v1/models/legalsum-pro', 1),
('SentimentPro-v2', 'Advanced sentiment analysis model', 11, 6, '2.0.0', 'deployed', '{"accuracy": 0.94, "latency_ms": 45, "throughput": 2000}', 'https://api.platform.ai/v1/models/sentimentpro-v2', 1),
('ChatAssist-v1', 'General conversational assistant', 9, 8, '1.0.0', 'ready', '{"perplexity": 12.5, "latency_ms": 150}', NULL, 1),
('Translator-ES-v1', 'English-Spanish translator', 11, 10, '1.0.0', 'deployed', '{"bleu": 0.82, "latency_ms": 100}', 'https://api.platform.ai/v1/models/translator-es', 2),
('InstructFollow-v1', 'Instruction following model', 8, 13, '1.0.0', 'ready', '{"accuracy": 0.91, "latency_ms": 280}', NULL, 1),
('BugClass-v1', 'Bug report classifier', 16, 14, '1.0.0', 'deployed', '{"accuracy": 0.93, "f1": 0.92, "latency_ms": 55}', 'https://api.platform.ai/v1/models/bugclass-v1', 2),
('ContentMod-v1', 'Content moderation model', 9, 17, '1.0.0', 'deployed', '{"accuracy": 0.96, "f1": 0.95, "latency_ms": 40}', 'https://api.platform.ai/v1/models/contentmod-v1', 1),
('SupportBot-v2.0', 'Improved support chatbot', 9, 1, '2.0.0', 'ready', '{"accuracy": 0.91, "latency_ms": 110}', NULL, 1),
('MedQA-Lite', 'Lightweight medical QA', 9, 2, '1.1.0', 'archived', '{"accuracy": 0.85, "latency_ms": 80}', NULL, 1),
('FinanceAnalyst-v1', 'Financial analysis model (in training)', 11, 12, '0.1.0', 'training', NULL, NULL, 2),
('SQLGen-v2', 'SQL generation model (in training)', 15, 7, '0.2.0', 'training', NULL, NULL, 2),
('SentimentPro-v1', 'Original sentiment model (archived)', 11, 6, '1.0.0', 'archived', '{"accuracy": 0.90, "latency_ms": 60}', NULL, 1),
('ResumeParser-Alpha', 'Resume parsing model (in training)', 11, 18, '0.1.0', 'training', NULL, NULL, 2),
('ChatAssist-v2', 'Enhanced conversational model', 8, 8, '2.0.0', 'ready', '{"perplexity": 10.2, "latency_ms": 140}', NULL, 1),
('LegalSum-Lite', 'Compact legal summarizer', 9, 4, '1.1.0', 'ready', '{"rouge_l": 0.80, "latency_ms": 180}', NULL, 1);

-- Evaluations (18 evaluations)
INSERT INTO evaluations (name, description, model_id, dataset_id, eval_type, metrics, status, results, user_id, completed_at) VALUES
('SupportBot Accuracy Test', 'Accuracy evaluation on held-out support data', 1, 1, 'accuracy', '["accuracy", "f1", "precision", "recall"]', 'completed', '{"accuracy": 0.89, "f1": 0.87, "precision": 0.88, "recall": 0.86}', 1, NOW() - INTERVAL '1 day'),
('MedQA Safety Eval', 'Safety and accuracy evaluation for medical model', 2, 2, 'safety', '["accuracy", "safety_score", "hallucination_rate"]', 'completed', '{"accuracy": 0.92, "safety_score": 0.95, "hallucination_rate": 0.03}', 1, NOW() - INTERVAL '4 days'),
('LegalSum ROUGE Eval', 'ROUGE score evaluation for legal summarizer', 4, 4, 'rouge', '["rouge_1", "rouge_2", "rouge_l"]', 'completed', '{"rouge_1": 0.88, "rouge_2": 0.78, "rouge_l": 0.85}', 1, NOW() - INTERVAL '1 day'),
('SentimentPro Benchmark', 'Benchmark against standard sentiment datasets', 5, 6, 'benchmark', '["accuracy", "f1", "matthews_corr"]', 'completed', '{"accuracy": 0.94, "f1": 0.93, "matthews_corr": 0.88}', 1, NOW() - INTERVAL '9 days'),
('Translator BLEU Test', 'BLEU score evaluation for translation model', 7, 10, 'bleu', '["bleu", "ter", "meteor"]', 'completed', '{"bleu": 0.82, "ter": 0.22, "meteor": 0.85}', 2, NOW() - INTERVAL '2 days'),
('ContentMod Precision Test', 'Precision-focused eval for content moderation', 10, 17, 'accuracy', '["accuracy", "precision", "recall", "f1"]', 'completed', '{"accuracy": 0.96, "precision": 0.97, "recall": 0.95, "f1": 0.96}', 1, NOW() - INTERVAL '3 days'),
('BugClass Cross-Val', 'Cross-validation evaluation', 9, 14, 'cross-validation', '["accuracy", "f1", "std_dev"]', 'completed', '{"accuracy": 0.93, "f1": 0.92, "std_dev": 0.015}', 2, NOW() - INTERVAL '7 days'),
('ChatAssist Perplexity', 'Perplexity measurement on test set', 6, 8, 'perplexity', '["perplexity", "token_accuracy"]', 'completed', '{"perplexity": 12.5, "token_accuracy": 0.78}', 1, NOW() - INTERVAL '6 days'),
('SupportBot v2 Regression', 'Regression test for updated support model', 11, 1, 'regression', '["accuracy", "f1", "latency"]', 'running', NULL, 1, NULL),
('MedQA Hallucination Check', 'Check for hallucinated medical information', 2, 2, 'hallucination', '["hallucination_rate", "factual_accuracy"]', 'pending', NULL, 1, NULL),
('InstructFollow Alignment', 'Alignment evaluation for instruction model', 8, 13, 'alignment', '["instruction_following", "helpfulness", "safety"]', 'completed', '{"instruction_following": 0.91, "helpfulness": 0.88, "safety": 0.94}', 1, NOW() - INTERVAL '13 days'),
('SentimentPro v1 vs v2', 'Compare v1 and v2 sentiment models', 5, 6, 'comparison', '["accuracy_delta", "speed_delta"]', 'completed', '{"accuracy_delta": 0.04, "speed_delta": -15}', 1, NOW() - INTERVAL '8 days'),
('Translator Fluency Test', 'Human fluency evaluation for translations', 7, 10, 'human-eval', '["fluency", "adequacy", "overall"]', 'pending', NULL, 2, NULL),
('LegalSum Length Analysis', 'Analyze summary length distribution', 4, 4, 'analysis', '["avg_length", "compression_ratio"]', 'completed', '{"avg_length": 245, "compression_ratio": 0.12}', 1, NOW() - INTERVAL '1 day'),
('CodeReview Alpha Test', 'Initial evaluation of code review model', 3, 3, 'accuracy', '["accuracy", "relevance", "actionability"]', 'running', NULL, 2, NULL),
('ContentMod Edge Cases', 'Test content moderation on edge cases', 10, 17, 'stress-test', '["accuracy", "false_positive_rate"]', 'pending', NULL, 1, NULL),
('ChatAssist v2 Eval', 'Evaluate improved conversational model', 17, 8, 'perplexity', '["perplexity", "coherence"]', 'completed', '{"perplexity": 10.2, "coherence": 0.89}', 1, NOW() - INTERVAL '5 days'),
('FinanceAnalyst Preview', 'Preview eval of finance model', 13, 12, 'accuracy', '["accuracy", "precision"]', 'running', NULL, 2, NULL);

-- API Keys (16 keys)
INSERT INTO api_keys (name, key_prefix, key_hash, permissions, rate_limit, is_active, last_used_at, user_id, expires_at) VALUES
('Production API Key', 'aft_prod_', 'hash_prod_001', '["read", "write", "deploy"]', 5000, true, NOW() - INTERVAL '1 hour', 1, NOW() + INTERVAL '365 days'),
('Development Key', 'aft_dev_', 'hash_dev_002', '["read", "write"]', 1000, true, NOW() - INTERVAL '2 hours', 1, NOW() + INTERVAL '180 days'),
('Testing Key', 'aft_test_', 'hash_test_003', '["read"]', 500, true, NOW() - INTERVAL '1 day', 2, NOW() + INTERVAL '90 days'),
('CI/CD Pipeline Key', 'aft_cicd_', 'hash_cicd_004', '["read", "write", "deploy"]', 2000, true, NOW() - INTERVAL '30 minutes', 1, NOW() + INTERVAL '365 days'),
('Monitoring Key', 'aft_mon_', 'hash_mon_005', '["read"]', 10000, true, NOW() - INTERVAL '5 minutes', 1, NOW() + INTERVAL '365 days'),
('Staging Key', 'aft_stg_', 'hash_stg_006', '["read", "write"]', 1000, true, NOW() - INTERVAL '3 hours', 2, NOW() + INTERVAL '180 days'),
('Analytics Key', 'aft_ana_', 'hash_ana_007', '["read"]', 2000, true, NOW() - INTERVAL '6 hours', 1, NOW() + INTERVAL '365 days'),
('Webhook Key', 'aft_whk_', 'hash_whk_008', '["write"]', 500, true, NOW() - INTERVAL '12 hours', 2, NOW() + INTERVAL '90 days'),
('Admin Master Key', 'aft_adm_', 'hash_adm_009', '["read", "write", "deploy", "admin"]', 10000, true, NOW() - INTERVAL '10 minutes', 1, NOW() + INTERVAL '365 days'),
('Mobile App Key', 'aft_mob_', 'hash_mob_010', '["read", "write"]', 3000, true, NOW() - INTERVAL '4 hours', 1, NOW() + INTERVAL '365 days'),
('Partner Integration', 'aft_prt_', 'hash_prt_011', '["read"]', 1000, true, NOW() - INTERVAL '2 days', 2, NOW() + INTERVAL '180 days'),
('Deprecated Key v1', 'aft_old_', 'hash_old_012', '["read"]', 100, false, NOW() - INTERVAL '30 days', 1, NOW() - INTERVAL '1 day'),
('Data Export Key', 'aft_exp_', 'hash_exp_013', '["read"]', 500, true, NOW() - INTERVAL '1 day', 2, NOW() + INTERVAL '90 days'),
('Model Serving Key', 'aft_srv_', 'hash_srv_014', '["read", "deploy"]', 5000, true, NOW() - INTERVAL '20 minutes', 1, NOW() + INTERVAL '365 days'),
('Batch Processing Key', 'aft_bat_', 'hash_bat_015', '["read", "write"]', 2000, true, NOW() - INTERVAL '8 hours', 2, NOW() + INTERVAL '180 days'),
('Viewer Access Key', 'aft_vw_', 'hash_vw_016', '["read"]', 500, true, NOW() - INTERVAL '5 hours', 3, NOW() + INTERVAL '90 days');

-- Deployments (16 deployments)
INSERT INTO deployments (name, model_id, environment, status, endpoint_url, replicas, config, user_id) VALUES
('SupportBot Production', 1, 'production', 'active', 'https://api.platform.ai/v1/models/supportbot-v1', 3, '{"gpu": "A100", "memory": "16GB", "auto_scale": true, "min_replicas": 2, "max_replicas": 10}', 1),
('SupportBot Staging', 1, 'staging', 'active', 'https://staging.platform.ai/v1/models/supportbot-v1', 1, '{"gpu": "T4", "memory": "8GB", "auto_scale": false}', 1),
('LegalSum Production', 4, 'production', 'active', 'https://api.platform.ai/v1/models/legalsum-pro', 2, '{"gpu": "A100", "memory": "32GB", "auto_scale": true, "min_replicas": 1, "max_replicas": 5}', 1),
('SentimentPro Production', 5, 'production', 'active', 'https://api.platform.ai/v1/models/sentimentpro-v2', 4, '{"gpu": "T4", "memory": "8GB", "auto_scale": true, "min_replicas": 2, "max_replicas": 20}', 1),
('Translator Production', 7, 'production', 'active', 'https://api.platform.ai/v1/models/translator-es', 2, '{"gpu": "A100", "memory": "16GB", "auto_scale": true}', 2),
('BugClass Production', 9, 'production', 'active', 'https://api.platform.ai/v1/models/bugclass-v1', 2, '{"gpu": "T4", "memory": "8GB", "auto_scale": true}', 2),
('ContentMod Production', 10, 'production', 'active', 'https://api.platform.ai/v1/models/contentmod-v1', 5, '{"gpu": "T4", "memory": "8GB", "auto_scale": true, "min_replicas": 3, "max_replicas": 25}', 1),
('SupportBot Dev', 11, 'development', 'active', 'https://dev.platform.ai/v1/models/supportbot-v2', 1, '{"gpu": "T4", "memory": "8GB"}', 1),
('LegalSum Staging', 18, 'staging', 'active', 'https://staging.platform.ai/v1/models/legalsum-lite', 1, '{"gpu": "T4", "memory": "16GB"}', 1),
('ChatAssist Staging', 6, 'staging', 'inactive', 'https://staging.platform.ai/v1/models/chatassist-v1', 1, '{"gpu": "T4", "memory": "8GB"}', 1),
('SentimentPro Staging', 5, 'staging', 'active', 'https://staging.platform.ai/v1/models/sentimentpro-v2', 1, '{"gpu": "T4", "memory": "8GB"}', 1),
('Translator Staging', 7, 'staging', 'active', 'https://staging.platform.ai/v1/models/translator-es', 1, '{"gpu": "T4", "memory": "8GB"}', 2),
('ContentMod Staging', 10, 'staging', 'active', 'https://staging.platform.ai/v1/models/contentmod-v1', 1, '{"gpu": "T4", "memory": "8GB"}', 1),
('InstructFollow Dev', 8, 'development', 'inactive', 'https://dev.platform.ai/v1/models/instructfollow-v1', 1, '{"gpu": "T4", "memory": "16GB"}', 1),
('ChatAssist v2 Dev', 17, 'development', 'scaling', 'https://dev.platform.ai/v1/models/chatassist-v2', 2, '{"gpu": "A100", "memory": "16GB", "auto_scale": true}', 1),
('BugClass Staging', 9, 'staging', 'failed', 'https://staging.platform.ai/v1/models/bugclass-v1', 0, '{"gpu": "T4", "memory": "8GB", "error": "insufficient resources"}', 2);

-- Training Configs (16 configs)
INSERT INTO training_configs (name, description, learning_rate, batch_size, epochs, warmup_steps, optimizer, scheduler, max_seq_length, lora_rank, lora_alpha, category, user_id) VALUES
('Default LoRA Config', 'Standard LoRA configuration for general fine-tuning', 0.0002, 8, 3, 100, 'adamw', 'cosine', 2048, 16, 32, 'general', 1),
('Aggressive Fine-Tune', 'Higher learning rate for fast convergence', 0.0005, 16, 5, 200, 'adamw', 'linear', 2048, 32, 64, 'fast-training', 1),
('Conservative Medical', 'Low learning rate for safety-critical medical models', 0.00005, 4, 10, 500, 'adamw', 'cosine_with_restarts', 4096, 8, 16, 'medical', 1),
('Code Generation', 'Optimized for code generation tasks', 0.00015, 8, 4, 150, 'adamw', 'cosine', 8192, 16, 32, 'code', 2),
('Large Model LoRA', 'LoRA config for 70B+ parameter models', 0.00005, 2, 3, 100, 'adamw', 'cosine', 4096, 8, 16, 'large-model', 1),
('Classification Fast', 'Quick training for classification tasks', 0.0003, 32, 3, 50, 'adam', 'step', 512, 16, 32, 'classification', 2),
('Summarization Config', 'Tuned for summarization tasks', 0.0001, 4, 5, 200, 'adamw', 'cosine', 4096, 16, 32, 'summarization', 1),
('Translation Config', 'Optimized for translation fine-tuning', 0.0002, 16, 4, 150, 'adamw', 'cosine', 2048, 16, 32, 'translation', 2),
('Chat/Dialogue Config', 'Multi-turn conversation training', 0.0002, 8, 3, 100, 'adamw', 'cosine', 4096, 32, 64, 'conversational', 1),
('Minimal Resources', 'For training on limited GPU memory', 0.0001, 1, 5, 50, 'adamw', 'cosine', 1024, 4, 8, 'resource-limited', 2),
('QLoRA 4-bit', 'Quantized LoRA for memory efficiency', 0.0002, 4, 3, 100, 'paged_adamw_8bit', 'cosine', 2048, 16, 32, 'quantized', 1),
('Full Fine-Tune Small', 'Full fine-tuning for small models (<1B)', 0.00005, 8, 10, 300, 'adamw', 'cosine_with_restarts', 2048, NULL, NULL, 'full-finetune', 1),
('Instruct Tuning', 'Instruction-following alignment config', 0.00007, 4, 3, 200, 'adamw', 'cosine', 4096, 16, 32, 'instruction', 1),
('DPO Config', 'Direct Preference Optimization settings', 0.00001, 4, 1, 100, 'rmsprop', 'cosine', 2048, 8, 16, 'alignment', 2),
('RLHF Stage 2', 'Config for RLHF reward model training', 0.00002, 8, 2, 200, 'adamw', 'linear', 2048, 16, 32, 'alignment', 1),
('Embedding Fine-Tune', 'Configuration for embedding model fine-tuning', 0.0001, 64, 5, 100, 'adamw', 'cosine', 512, NULL, NULL, 'embedding', 2);

-- Data Pipelines (16 pipelines)
INSERT INTO data_pipelines (name, description, source_type, destination, steps, status, schedule, last_run_at, user_id) VALUES
('Customer Support Ingestion', 'Ingest and clean customer support tickets', 'database', 'training_datasets', '[{"step": "extract", "config": {"source": "zendesk_api"}}, {"step": "clean", "config": {"remove_pii": true}}, {"step": "format", "config": {"output": "jsonl"}}]', 'completed', '0 2 * * *', NOW() - INTERVAL '6 hours', 1),
('Medical Records ETL', 'Extract and anonymize medical records', 'api', 'training_datasets', '[{"step": "extract", "config": {"source": "ehr_api"}}, {"step": "anonymize", "config": {"method": "k-anonymity"}}, {"step": "validate", "config": {"schema": "medical_qa"}}]', 'completed', '0 0 * * 0', NOW() - INTERVAL '2 days', 1),
('GitHub PR Reviews', 'Collect code reviews from GitHub', 'api', 'training_datasets', '[{"step": "extract", "config": {"source": "github_api"}}, {"step": "filter", "config": {"min_quality": 3}}, {"step": "format", "config": {"output": "jsonl"}}]', 'running', '0 4 * * *', NOW() - INTERVAL '12 hours', 2),
('Legal Doc Processor', 'Process and chunk legal documents', 'file_storage', 'training_datasets', '[{"step": "extract", "config": {"source": "s3_bucket"}}, {"step": "chunk", "config": {"max_tokens": 4096}}, {"step": "summarize", "config": {"model": "gpt-3.5"}}]', 'completed', '0 1 * * 1', NOW() - INTERVAL '5 days', 1),
('Product Catalog Sync', 'Sync product data from e-commerce platform', 'database', 'training_datasets', '[{"step": "extract", "config": {"source": "shopify_api"}}, {"step": "enrich", "config": {"add_categories": true}}, {"step": "format", "config": {"output": "csv"}}]', 'idle', '0 3 * * *', NOW() - INTERVAL '1 day', 2),
('Review Sentiment Pipeline', 'Process customer reviews for sentiment labeling', 'api', 'training_datasets', '[{"step": "extract", "config": {"source": "review_api"}}, {"step": "label", "config": {"model": "sentiment-base"}}, {"step": "validate", "config": {"min_confidence": 0.8}}]', 'completed', '0 6 * * *', NOW() - INTERVAL '8 hours', 1),
('SQL Training Data Gen', 'Generate SQL training pairs from schemas', 'database', 'training_datasets', '[{"step": "extract_schemas", "config": {"databases": ["prod", "staging"]}}, {"step": "generate_pairs", "config": {"complexity": "mixed"}}, {"step": "validate_sql", "config": {"execute": true}}]', 'idle', '0 0 1 * *', NOW() - INTERVAL '15 days', 2),
('Chat Log Processor', 'Process multi-turn chat logs', 'file_storage', 'training_datasets', '[{"step": "extract", "config": {"source": "chat_logs"}}, {"step": "segment", "config": {"by": "conversation"}}, {"step": "filter", "config": {"min_turns": 3}}]', 'completed', '0 5 * * *', NOW() - INTERVAL '10 hours', 1),
('ArXiv Paper Scraper', 'Scrape and process research papers from ArXiv', 'api', 'training_datasets', '[{"step": "scrape", "config": {"categories": ["cs.AI", "cs.CL"]}}, {"step": "parse_pdf", "config": {"extract_sections": true}}, {"step": "chunk", "config": {"max_tokens": 2048}}]', 'failed', '0 0 * * 1,4', NOW() - INTERVAL '3 days', 1),
('Translation Pair Mining', 'Mine parallel translation pairs from web', 'api', 'training_datasets', '[{"step": "crawl", "config": {"languages": ["en", "es"]}}, {"step": "align", "config": {"method": "bertalign"}}, {"step": "filter", "config": {"min_quality": 0.9}}]', 'completed', '0 2 * * 0', NOW() - INTERVAL '4 days', 2),
('Image Caption Pipeline', 'Generate captions for training images', 'file_storage', 'training_datasets', '[{"step": "load_images", "config": {"source": "s3"}}, {"step": "generate_captions", "config": {"model": "blip-2"}}, {"step": "validate", "config": {"human_review": false}}]', 'idle', '0 0 * * *', NOW() - INTERVAL '7 days', 1),
('Financial News Feed', 'Process financial news for analysis training', 'api', 'training_datasets', '[{"step": "extract", "config": {"sources": ["reuters", "bloomberg"]}}, {"step": "analyze", "config": {"add_sentiment": true}}, {"step": "format", "config": {"output": "jsonl"}}]', 'running', '*/30 * * * *', NOW() - INTERVAL '30 minutes', 2),
('Instruction Data Mixer', 'Mix and deduplicate instruction datasets', 'file_storage', 'training_datasets', '[{"step": "load", "config": {"datasets": ["alpaca", "dolly", "oasst"]}}, {"step": "deduplicate", "config": {"similarity_threshold": 0.95}}, {"step": "balance", "config": {"by": "category"}}]', 'completed', NULL, NOW() - INTERVAL '20 days', 1),
('Bug Report Collector', 'Collect and classify bug reports from Jira', 'api', 'training_datasets', '[{"step": "extract", "config": {"source": "jira_api"}}, {"step": "classify", "config": {"model": "classifier-base"}}, {"step": "format", "config": {"output": "jsonl"}}]', 'idle', '0 1 * * *', NOW() - INTERVAL '2 days', 2),
('Content Moderation Data', 'Collect and label content for moderation training', 'database', 'training_datasets', '[{"step": "extract", "config": {"source": "moderation_queue"}}, {"step": "label", "config": {"categories": ["toxic", "spam", "safe"]}}, {"step": "balance", "config": {"oversample_minority": true}}]', 'completed', '0 3 * * 1', NOW() - INTERVAL '6 days', 1),
('Resume Data Pipeline', 'Process resumes for NER training', 'file_storage', 'training_datasets', '[{"step": "extract", "config": {"source": "uploads"}}, {"step": "parse", "config": {"format": "pdf"}}, {"step": "annotate", "config": {"entities": ["name", "email", "skills", "experience"]}}]', 'idle', '0 0 * * 0', NOW() - INTERVAL '9 days', 2);

-- Model Comparisons (16 comparisons)
INSERT INTO model_comparisons (name, description, model_ids, metrics, results, status, user_id, completed_at) VALUES
('SupportBot v1 vs v2', 'Compare support bot versions', '[1, 11]', '["accuracy", "latency", "f1"]', '{"model_1": {"accuracy": 0.89, "latency": 120, "f1": 0.87}, "model_2": {"accuracy": 0.91, "latency": 110, "f1": 0.90}, "winner": "model_2"}', 'completed', 1, NOW() - INTERVAL '1 day'),
('SentimentPro v1 vs v2', 'Compare sentiment analysis versions', '[15, 5]', '["accuracy", "f1", "throughput"]', '{"model_1": {"accuracy": 0.90, "f1": 0.89, "throughput": 1500}, "model_2": {"accuracy": 0.94, "f1": 0.93, "throughput": 2000}, "winner": "model_2"}', 'completed', 1, NOW() - INTERVAL '8 days'),
('Medical vs General QA', 'Specialized vs general model for medical QA', '[2, 6]', '["accuracy", "safety_score"]', '{"model_1": {"accuracy": 0.92, "safety_score": 0.95}, "model_2": {"accuracy": 0.75, "safety_score": 0.82}, "winner": "model_1"}', 'completed', 1, NOW() - INTERVAL '3 days'),
('Code Review Models', 'Compare code review approaches', '[3, 14]', '["accuracy", "relevance"]', NULL, 'running', 2, NULL),
('Translation Quality', 'Compare translation model quality', '[7, 6]', '["bleu", "meteor", "human_score"]', '{"model_1": {"bleu": 0.82, "meteor": 0.85, "human_score": 4.2}, "model_2": {"bleu": 0.65, "meteor": 0.70, "human_score": 3.5}, "winner": "model_1"}', 'completed', 2, NOW() - INTERVAL '2 days'),
('Content Mod Precision', 'Compare moderation model precision', '[10, 5]', '["precision", "recall", "f1"]', '{"model_1": {"precision": 0.97, "recall": 0.95, "f1": 0.96}, "model_2": {"precision": 0.85, "recall": 0.80, "f1": 0.82}, "winner": "model_1"}', 'completed', 1, NOW() - INTERVAL '3 days'),
('Bug Classifier Benchmark', 'Benchmark bug classification models', '[9, 1]', '["accuracy", "f1"]', '{"model_1": {"accuracy": 0.93, "f1": 0.92}, "model_2": {"accuracy": 0.78, "f1": 0.75}, "winner": "model_1"}', 'completed', 2, NOW() - INTERVAL '7 days'),
('ChatAssist v1 vs v2', 'Compare chat assistant versions', '[6, 17]', '["perplexity", "coherence", "user_satisfaction"]', '{"model_1": {"perplexity": 12.5, "coherence": 0.82, "user_satisfaction": 3.8}, "model_2": {"perplexity": 10.2, "coherence": 0.89, "user_satisfaction": 4.3}, "winner": "model_2"}', 'completed', 1, NOW() - INTERVAL '4 days'),
('LegalSum Full vs Lite', 'Compare legal summarizer variants', '[4, 18]', '["rouge_l", "latency", "cost"]', '{"model_1": {"rouge_l": 0.85, "latency": 350, "cost": 0.002}, "model_2": {"rouge_l": 0.80, "latency": 180, "cost": 0.001}, "winner": "model_1"}', 'completed', 1, NOW() - INTERVAL '1 day'),
('InstructFollow vs Chat', 'Instruction following vs chat model', '[8, 6]', '["instruction_accuracy", "helpfulness"]', '{"model_1": {"instruction_accuracy": 0.91, "helpfulness": 0.88}, "model_2": {"instruction_accuracy": 0.80, "helpfulness": 0.85}, "winner": "model_1"}', 'completed', 1, NOW() - INTERVAL '12 days'),
('Base Model Showdown', 'Compare Llama vs Mistral base models', '[1, 5]', '["general_accuracy", "speed", "cost"]', NULL, 'pending', 1, NULL),
('Multilingual Compare', 'Compare multilingual capabilities', '[7, 2]', '["en_accuracy", "es_accuracy", "multilingual_score"]', NULL, 'pending', 2, NULL),
('Speed vs Accuracy', 'Trade-off analysis: fast vs accurate models', '[5, 4]', '["accuracy", "latency", "cost_per_1k"]', '{"model_1": {"accuracy": 0.94, "latency": 45, "cost_per_1k": 0.001}, "model_2": {"accuracy": 0.85, "latency": 350, "cost_per_1k": 0.003}, "recommendation": "model_1 for real-time, model_2 for batch"}', 'completed', 1, NOW() - INTERVAL '5 days'),
('Resume Parser Options', 'Compare resume parsing approaches', '[16, 1]', '["extraction_accuracy", "field_coverage"]', NULL, 'running', 2, NULL),
('Finance Model Candidates', 'Evaluate finance model candidates', '[13, 2]', '["accuracy", "domain_knowledge"]', NULL, 'running', 2, NULL),
('Embedding Models Test', 'Compare embedding model fine-tunes', '[1, 11]', '["similarity_score", "retrieval_accuracy"]', '{"model_1": {"similarity_score": 0.88, "retrieval_accuracy": 0.82}, "model_2": {"similarity_score": 0.91, "retrieval_accuracy": 0.87}, "winner": "model_2"}', 'completed', 1, NOW() - INTERVAL '6 days');

-- Prompt Templates (18 templates)
INSERT INTO prompt_templates (name, description, category, template_text, variables, example_output, is_public, user_id) VALUES
('Customer Support Response', 'Generate professional customer support replies', 'customer-support', 'You are a helpful customer support agent for {{company_name}}. The customer has the following issue:\n\n{{customer_issue}}\n\nProvide a professional, empathetic response that addresses their concern.', '["company_name", "customer_issue"]', 'Dear valued customer, thank you for reaching out. I understand your frustration with the billing issue...', true, 1),
('Code Review Feedback', 'Generate constructive code review comments', 'code', 'Review the following {{language}} code and provide constructive feedback:\n\n```{{language}}\n{{code}}\n```\n\nFocus on: {{focus_areas}}', '["language", "code", "focus_areas"]', 'Overall the code is well-structured. Here are some suggestions:\n1. Consider extracting the validation logic into a separate function...', true, 2),
('Medical Summary', 'Summarize medical information for patients', 'medical', 'Summarize the following medical information in plain language that a patient can understand:\n\nCondition: {{condition}}\nDiagnosis: {{diagnosis}}\nTreatment Plan: {{treatment}}\n\nUse simple terms and avoid jargon.', '["condition", "diagnosis", "treatment"]', 'Your doctor has found that you have a mild case of... The treatment plan includes...', false, 1),
('Legal Document Summary', 'Summarize legal documents in plain English', 'legal', 'Summarize the following legal document section in plain English:\n\nDocument Type: {{doc_type}}\nSection: {{section}}\n\nContent:\n{{content}}\n\nProvide a clear, concise summary highlighting key obligations and rights.', '["doc_type", "section", "content"]', 'This section of the agreement states that the party agrees to...', true, 1),
('Product Description', 'Generate marketing product descriptions', 'marketing', 'Write a compelling product description for:\n\nProduct: {{product_name}}\nCategory: {{category}}\nKey Features: {{features}}\nTarget Audience: {{audience}}\n\nTone: {{tone}}', '["product_name", "category", "features", "audience", "tone"]', 'Introducing the revolutionary SmartWidget Pro...', true, 2),
('SQL Query Generator', 'Generate SQL queries from natural language', 'code', 'Given the following database schema:\n\n{{schema}}\n\nGenerate a SQL query for: {{request}}\n\nRequirements:\n- Use proper JOINs where needed\n- Include appropriate WHERE clauses\n- Optimize for performance', '["schema", "request"]', 'SELECT u.name, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id...', true, 2),
('Sentiment Analysis Prompt', 'Analyze sentiment of text', 'analysis', 'Analyze the sentiment of the following text and provide:\n1. Overall sentiment (positive/negative/neutral)\n2. Confidence score (0-1)\n3. Key phrases contributing to sentiment\n\nText: {{text}}', '["text"]', '{"sentiment": "positive", "confidence": 0.87, "key_phrases": ["excellent service", "highly recommend"]}', true, 1),
('Bug Report Generator', 'Generate structured bug reports', 'development', 'Generate a structured bug report based on the following information:\n\nTitle: {{title}}\nSteps to Reproduce: {{steps}}\nExpected Behavior: {{expected}}\nActual Behavior: {{actual}}\nEnvironment: {{environment}}', '["title", "steps", "expected", "actual", "environment"]', '## Bug Report\n**Title:** Login page crashes on mobile\n**Severity:** High\n**Steps to Reproduce:**...', true, 2),
('Data Analysis Report', 'Generate data analysis reports', 'analysis', 'Analyze the following dataset statistics and generate a comprehensive report:\n\nDataset: {{dataset_name}}\nSize: {{size}} samples\nFeatures: {{features}}\nStatistics: {{statistics}}\n\nInclude insights, anomalies, and recommendations.', '["dataset_name", "size", "features", "statistics"]', '# Data Analysis Report\n## Overview\nThe dataset contains 50,000 samples with 12 features...', true, 1),
('API Documentation', 'Generate API endpoint documentation', 'development', 'Generate API documentation for the following endpoint:\n\nMethod: {{method}}\nPath: {{path}}\nDescription: {{description}}\nParameters: {{parameters}}\nResponse Format: {{response_format}}', '["method", "path", "description", "parameters", "response_format"]', '## POST /api/v1/predictions\n\nGenerate predictions using a deployed model.\n\n### Parameters...', true, 2),
('Training Data Validator', 'Validate training data quality', 'data', 'Review the following training data samples and identify quality issues:\n\nFormat: {{format}}\nSamples:\n{{samples}}\n\nCheck for:\n- Consistency\n- Completeness\n- Label accuracy\n- Potential biases', '["format", "samples"]', 'Quality Report:\n- 3 samples have inconsistent labeling\n- 1 sample is missing the output field...', false, 1),
('Model Evaluation Report', 'Generate model evaluation reports', 'evaluation', 'Generate an evaluation report for:\n\nModel: {{model_name}}\nTask: {{task}}\nMetrics: {{metrics}}\nBaseline: {{baseline}}\n\nProvide analysis and recommendations.', '["model_name", "task", "metrics", "baseline"]', '# Model Evaluation Report\n## Summary\nThe model shows a 5% improvement over baseline...', true, 1),
('Conversation Starter', 'Generate conversation starters for chatbots', 'conversational', 'Generate {{count}} conversation starters for a {{bot_type}} chatbot.\n\nTone: {{tone}}\nDomain: {{domain}}\n\nEach starter should be engaging and relevant to the domain.', '["count", "bot_type", "tone", "domain"]', '1. "Hi there! I noticed you have a question about your account. How can I help?"\n2. "Welcome back!..."', true, 1),
('Fine-Tuning Report', 'Generate fine-tuning job reports', 'ml-ops', 'Generate a comprehensive fine-tuning report:\n\nJob: {{job_name}}\nBase Model: {{base_model}}\nDataset: {{dataset}}\nConfig: {{config}}\nMetrics: {{metrics}}\n\nInclude analysis of training curves, recommendations for improvement, and next steps.', '["job_name", "base_model", "dataset", "config", "metrics"]', '# Fine-Tuning Report\n## Job: SupportBot v2\n### Training Summary\nThe model converged after epoch 2...', true, 1),
('Error Analysis Template', 'Analyze model errors and failure modes', 'evaluation', 'Analyze the following model errors:\n\nModel: {{model_name}}\nError Samples:\n{{error_samples}}\n\nCategorize errors, identify patterns, and suggest improvements.', '["model_name", "error_samples"]', '## Error Analysis\n### Categories\n1. Factual Errors (35%): The model frequently confuses...', false, 2),
('Deployment Checklist', 'Generate model deployment checklists', 'ml-ops', 'Generate a deployment checklist for:\n\nModel: {{model_name}}\nEnvironment: {{environment}}\nRequirements: {{requirements}}\n\nInclude pre-deployment, deployment, and post-deployment steps.', '["model_name", "environment", "requirements"]', '# Deployment Checklist\n## Pre-Deployment\n- [ ] Model performance validated\n- [ ] A/B test configured...', true, 1),
('Dataset Card Generator', 'Generate dataset documentation cards', 'data', 'Generate a dataset card for:\n\nName: {{dataset_name}}\nDescription: {{description}}\nSize: {{size}}\nFormat: {{format}}\nSource: {{source}}\n\nFollow the Hugging Face dataset card format.', '["dataset_name", "description", "size", "format", "source"]', '---\nlicense: apache-2.0\ntask_categories:\n- text-generation\n---\n# Dataset Card for...', true, 2),
('Hyperparameter Tuning', 'Suggest hyperparameter configurations', 'ml-ops', 'Suggest hyperparameter configurations for:\n\nTask: {{task}}\nModel: {{model}}\nDataset Size: {{dataset_size}}\nCompute Budget: {{compute_budget}}\n\nProvide 3 configurations: conservative, balanced, and aggressive.', '["task", "model", "dataset_size", "compute_budget"]', '## Hyperparameter Suggestions\n### Conservative\n- Learning Rate: 1e-5\n- Batch Size: 4...', true, 1);

-- Usage & Billing (20 records)
INSERT INTO usage_billing (user_id, resource_type, resource_id, tokens_used, compute_hours, cost, billing_period) VALUES
(1, 'fine-tuning', 1, 15000000, 4.50, 12.50, '2024-01'),
(1, 'fine-tuning', 2, 45000000, 12.00, 35.00, '2024-01'),
(2, 'fine-tuning', 3, 8000000, 2.50, 8.75, '2024-01'),
(1, 'inference', 1, 2500000, 0.50, 2.50, '2024-01'),
(1, 'inference', 4, 1800000, 0.80, 4.00, '2024-01'),
(1, 'fine-tuning', 4, 25000000, 8.00, 24.00, '2024-01'),
(2, 'fine-tuning', 5, 5000000, 1.50, 5.25, '2024-02'),
(1, 'fine-tuning', 6, 30000000, 6.00, 18.00, '2024-02'),
(2, 'fine-tuning', 7, 12000000, 3.50, 10.50, '2024-02'),
(1, 'inference', 5, 5000000, 1.00, 5.00, '2024-02'),
(1, 'fine-tuning', 8, 18000000, 5.00, 15.00, '2024-02'),
(1, 'inference', 10, 3500000, 0.70, 3.50, '2024-02'),
(2, 'inference', 7, 4200000, 0.90, 4.50, '2024-02'),
(1, 'fine-tuning', 13, 50000000, 15.00, 45.00, '2024-03'),
(2, 'fine-tuning', 14, 10000000, 3.00, 9.00, '2024-03'),
(1, 'fine-tuning', 17, 20000000, 4.00, 12.00, '2024-03'),
(1, 'inference', 1, 8000000, 1.50, 7.50, '2024-03'),
(1, 'inference', 5, 12000000, 2.00, 10.00, '2024-03'),
(2, 'inference', 9, 3000000, 0.60, 3.00, '2024-03'),
(1, 'storage', NULL, 0, 0, 25.00, '2024-03');

-- Audit Logs (20 logs)
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES
(1, 'login', 'auth', NULL, '{"method": "password", "success": true}', '192.168.1.100'),
(1, 'create', 'fine_tuning_job', 1, '{"name": "Support Bot v1", "base_model": "Llama 3.1 8B"}', '192.168.1.100'),
(1, 'create', 'dataset', 1, '{"name": "Customer Support Conversations", "samples": 50000}', '192.168.1.100'),
(2, 'login', 'auth', NULL, '{"method": "password", "success": true}', '10.0.0.50'),
(2, 'create', 'fine_tuning_job', 3, '{"name": "Code Reviewer AI", "base_model": "CodeLlama 34B"}', '10.0.0.50'),
(1, 'deploy', 'deployment', 1, '{"model": "SupportBot-v1.0", "environment": "production"}', '192.168.1.100'),
(1, 'create', 'api_key', 1, '{"name": "Production API Key", "permissions": ["read", "write", "deploy"]}', '192.168.1.100'),
(1, 'update', 'fine_tuning_job', 1, '{"status": "completed", "metrics": {"accuracy": 0.89}}', '192.168.1.100'),
(2, 'create', 'deployment', 5, '{"model": "Translator-ES-v1", "environment": "production"}', '10.0.0.50'),
(1, 'delete', 'api_key', 12, '{"name": "Deprecated Key v1", "reason": "expired"}', '192.168.1.100'),
(1, 'create', 'evaluation', 1, '{"name": "SupportBot Accuracy Test", "type": "accuracy"}', '192.168.1.100'),
(3, 'login', 'auth', NULL, '{"method": "password", "success": true}', '172.16.0.25'),
(1, 'update', 'deployment', 1, '{"replicas": 3, "auto_scale": true}', '192.168.1.100'),
(2, 'create', 'data_pipeline', 3, '{"name": "GitHub PR Reviews"}', '10.0.0.50'),
(1, 'create', 'model_comparison', 1, '{"name": "SupportBot v1 vs v2"}', '192.168.1.100'),
(1, 'update', 'custom_model', 1, '{"status": "deployed", "endpoint_url": "https://api.platform.ai/v1/models/supportbot-v1"}', '192.168.1.100'),
(2, 'create', 'training_config', 4, '{"name": "Code Generation"}', '10.0.0.50'),
(1, 'create', 'prompt_template', 1, '{"name": "Customer Support Response", "is_public": true}', '192.168.1.100'),
(1, 'login', 'auth', NULL, '{"method": "api_key", "success": true}', '203.0.113.50'),
(2, 'update', 'data_pipeline', 3, '{"status": "running"}', '10.0.0.50');

-- Team Members (16 members)
INSERT INTO team_members (user_id, team_name, role, invited_by, status) VALUES
(1, 'AI Platform Core', 'admin', NULL, 'active'),
(2, 'AI Platform Core', 'member', 1, 'active'),
(3, 'AI Platform Core', 'viewer', 1, 'active'),
(1, 'ML Engineering', 'admin', NULL, 'active'),
(2, 'ML Engineering', 'member', 1, 'active'),
(1, 'Data Science', 'admin', NULL, 'active'),
(2, 'Data Science', 'admin', 1, 'active'),
(3, 'Data Science', 'viewer', 1, 'active'),
(1, 'Production Ops', 'admin', NULL, 'active'),
(2, 'Production Ops', 'member', 1, 'active'),
(1, 'Research Team', 'member', NULL, 'active'),
(2, 'Research Team', 'admin', NULL, 'active'),
(3, 'Research Team', 'viewer', 2, 'invited'),
(1, 'Security & Compliance', 'admin', NULL, 'active'),
(3, 'Security & Compliance', 'viewer', 1, 'active'),
(2, 'Customer Solutions', 'member', 1, 'removed');
