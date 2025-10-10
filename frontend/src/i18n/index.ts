// Aggregate Dutch messages from namespaced JSON files
import navigation from './navigation.nl.json';
import dashboard from './dashboard.nl.json';
import groepsplanNew from './groepsplan.new.nl.json';
import groepsplanQ from './groepsplan.q.nl.json';
import groepsplanResult from './groepsplan.result.nl.json';
import documentMessages from './document.nl.json';
import documents from './documents.nl.json';
import auth from './auth.nl.json';
import error from './error.nl.json';
import misc from './misc.nl.json';
import pricingPayment from './pricing_payment.nl.json';
import complianceQuality from './compliance_quality.nl.json';
import other from './other.nl.json';
import legalStatus from './legal_status.nl.json';

export const nl = {
  ...navigation,
  ...dashboard,
  // Deep-merge groepsplan namespaces
  groepsplan: {
    ...((groepsplanNew as any).groepsplan || {}),
    ...((groepsplanQ as any).groepsplan || {}),
    ...((groepsplanResult as any).groepsplan || {}),
  },
  ...documentMessages,
  ...documents,
  ...auth,
  ...error,
  ...misc,
  ...pricingPayment,
  ...complianceQuality,
  ...other,
  ...legalStatus,
};

export const messages = { nl };
