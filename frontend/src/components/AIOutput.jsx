import React from 'react';
import { FiX, FiStar } from 'react-icons/fi';

function parseAIResponse(text) {
  if (!text || typeof text !== 'string') {
    if (typeof text === 'object') {
      text = JSON.stringify(text, null, 2);
    } else {
      return [{ type: 'text', content: String(text || 'No response received.') }];
    }
  }

  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;
  let currentItems = [];

  const flushItems = () => {
    if (currentItems.length > 0) {
      if (currentSection) {
        sections.push({ type: 'section', title: currentSection, items: [...currentItems] });
      } else {
        sections.push({ type: 'list', items: [...currentItems] });
      }
      currentItems = [];
      currentSection = null;
    } else if (currentSection) {
      sections.push({ type: 'section-header', title: currentSection });
      currentSection = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Section headers: lines ending with colon, or **Header**
    if (/^#{1,3}\s+/.test(trimmed)) {
      flushItems();
      currentSection = trimmed.replace(/^#{1,3}\s+/, '');
    } else if (/^\*\*[^*]+\*\*:?\s*$/.test(trimmed)) {
      flushItems();
      currentSection = trimmed.replace(/\*\*/g, '').replace(/:$/, '');
    } else if (/^[A-Z][A-Za-z\s&]+:$/.test(trimmed) && trimmed.length < 60) {
      flushItems();
      currentSection = trimmed.replace(/:$/, '');
    } else if (/^[-*]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      // List items
      const item = trimmed.replace(/^[-*]\s+/, '').replace(/^\d+[.)]\s+/, '');
      currentItems.push(item);
    } else if (trimmed.startsWith('>') || trimmed.startsWith('!')) {
      flushItems();
      sections.push({ type: 'highlight', content: trimmed.replace(/^[>!]\s*/, '') });
    } else {
      // Regular text
      if (currentItems.length > 0) {
        // Append to last item if it seems like continuation
        currentItems[currentItems.length - 1] += ' ' + trimmed;
      } else {
        flushItems();
        sections.push({ type: 'text', content: trimmed });
      }
    }
  }

  flushItems();

  if (sections.length === 0) {
    sections.push({ type: 'text', content: text });
  }

  return sections;
}

function getPriorityTag(text) {
  const lower = text.toLowerCase();
  if (lower.includes('critical') || lower.includes('high priority') || lower.includes('urgent')) {
    return 'high';
  }
  if (lower.includes('medium') || lower.includes('moderate') || lower.includes('warning')) {
    return 'medium';
  }
  if (lower.includes('low') || lower.includes('minor') || lower.includes('optional')) {
    return 'low';
  }
  return null;
}

function formatText(text) {
  // Bold
  let formatted = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:rgba(108,99,255,0.15);padding:2px 6px;border-radius:4px;font-size:12px;color:#8b83ff">$1</code>');
  return formatted;
}

export default function AIOutput({ response, loading, onClose }) {
  if (loading) {
    return (
      <div className="ai-output">
        <div className="ai-output-inner">
          <div className="ai-loading">
            <div className="ai-loading-dots">
              <div className="ai-loading-dot" />
              <div className="ai-loading-dot" />
              <div className="ai-loading-dot" />
            </div>
            <div className="ai-loading-text">AI is analyzing...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!response) return null;

  const responseText = typeof response === 'object'
    ? response.analysis || response.recommendations || response.result || response.message || response.response || JSON.stringify(response, null, 2)
    : response;

  const sections = parseAIResponse(responseText);

  return (
    <div className="ai-output">
      <div className="ai-output-inner">
        <div className="ai-output-header">
          <FiStar className="ai-output-sparkle" />
          <span className="ai-output-title">AI Assistant</span>
          {onClose && (
            <button className="ai-output-close" onClick={onClose}>
              <FiX />
            </button>
          )}
        </div>
        {sections.map((section, idx) => {
          if (section.type === 'section' || section.type === 'section-header') {
            return (
              <div className="ai-output-section" key={idx}>
                <div className="ai-output-section-title">{section.title}</div>
                {section.items && (
                  <ul className="ai-output-list">
                    {section.items.map((item, i) => {
                      const tag = getPriorityTag(item);
                      return (
                        <li key={i}>
                          <span dangerouslySetInnerHTML={{ __html: formatText(item) }} />
                          {tag && (
                            <span className={`ai-output-tag ai-output-tag-${tag}`}>
                              {tag}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          }
          if (section.type === 'list') {
            return (
              <div className="ai-output-section" key={idx}>
                <ul className="ai-output-list">
                  {section.items.map((item, i) => {
                    const tag = getPriorityTag(item);
                    return (
                      <li key={i}>
                        <span dangerouslySetInnerHTML={{ __html: formatText(item) }} />
                        {tag && (
                          <span className={`ai-output-tag ai-output-tag-${tag}`}>
                            {tag}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          }
          if (section.type === 'highlight') {
            return (
              <div className="ai-output-highlight" key={idx}>
                <span dangerouslySetInnerHTML={{ __html: formatText(section.content) }} />
              </div>
            );
          }
          return (
            <div className="ai-output-section" key={idx}>
              <p className="ai-output-text" dangerouslySetInnerHTML={{ __html: formatText(section.content) }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
