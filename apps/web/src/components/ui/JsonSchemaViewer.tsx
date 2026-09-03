import React, { useState } from 'react';
import { Copy, Check, FileCode, ShieldCheck } from 'lucide-react';
import { Badge } from './Badge.js';

interface JsonSchemaViewerProps {
  schema: Record<string, unknown>;
  title?: string;
  maxHeight?: number | string;
}

export const JsonSchemaViewer: React.FC<JsonSchemaViewerProps> = ({
  schema,
  title = 'Strict JSON Schema Contract',
  maxHeight = 280,
}) => {
  const [copied, setCopied] = useState(false);

  const formattedJson = JSON.stringify(schema, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const isStrict = schema['additionalProperties'] === false;
  const requiredCount = Array.isArray(schema['required']) ? schema['required'].length : 0;
  const propertiesCount =
    typeof schema['properties'] === 'object' && schema['properties'] !== null
      ? Object.keys(schema['properties']).length
      : 0;

  return (
    <div className="json-viewer-container">
      <div className="json-viewer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileCode size={14} style={{ color: 'var(--semantic-webmcp)' }} />
          <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {title}
          </span>
          {isStrict && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.68rem',
                padding: '1px 6px',
                borderRadius: 'var(--radius-xs)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <ShieldCheck size={11} />
              additionalProperties: false
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge variant="draft">{propertiesCount} props</Badge>
          <Badge variant="auth">{requiredCount} required</Badge>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
            style={{ padding: '2px 8px', fontSize: '0.72rem', gap: 4 }}
          >
            {copied ? (
              <Check size={12} style={{ color: 'var(--semantic-emerald)' }} />
            ) : (
              <Copy size={12} />
            )}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <pre className="json-viewer-content mono" style={{ maxHeight }}>
        {formattedJson}
      </pre>
    </div>
  );
};
