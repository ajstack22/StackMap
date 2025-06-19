# Team Integration Launch Prompt

## For Team Lead (Any Developer)

```
Coordinate final integration and testing of the complete CI/CD system.

Tasks to divide among team:
1. End-to-end testing of complete pipeline
2. Load testing the deployment process
3. Disaster recovery testing
4. Documentation review and updates
5. Creating training materials
6. Migration plan from old to new system
7. Rollback procedures for the migration itself

Deliverables:
- Complete runbook
- Training videos/screenshots
- Migration checklist
- Go-live plan
- Post-migration monitoring plan
```

## Integration Checklist

### Pre-Integration
- [ ] All individual components tested
- [ ] Dependencies documented
- [ ] Integration points identified
- [ ] Test environments ready

### During Integration
- [ ] Component compatibility verified
- [ ] Data flow tested end-to-end
- [ ] Error handling verified
- [ ] Performance benchmarks met
- [ ] Security review completed

### Post-Integration
- [ ] Full system test completed
- [ ] Documentation updated
- [ ] Team trained
- [ ] Monitoring active
- [ ] Support procedures in place

## Key Integration Points

1. **FTP Deploy → Atomic Structure**
   - FTP uploads to releases directory
   - Trigger symlink switch after upload
   - Verify shared directories linked

2. **Validation → Deployment**
   - Pre-checks must pass before FTP
   - Post-deploy health checks trigger rollback
   - Metrics collected throughout

3. **Staging → Production**
   - Automated staging deployment
   - Manual approval gate
   - Promotion to production

4. **Monitoring → Rollback**
   - Error detection triggers alerts
   - Automatic rollback on critical failures
   - Manual override available

## Success Metrics
- Deployment time: <3 minutes
- Rollback time: <30 seconds
- Success rate: >99%
- Zero downtime achieved
- All team members trained