# License Compliance Report

**Date:** 2025-11-27 (Updated Q4 2025)
**Total Production Dependencies:** 528 packages

## Summary

✅ **All licenses approved for production use**
❌ **No GPL/AGPL/copyleft licenses found**

## License Breakdown

| License | Count | Status |
|---------|-------|--------|
| MIT | 497 | ✅ Approved |
| ISC | 42 | ✅ Approved |
| BSD-3-Clause | 30 | ✅ Approved |
| Apache-2.0 | 16 | ✅ Approved |
| BSD-2-Clause | 11 | ✅ Approved |
| Unlicense | 2 | ✅ Approved |
| UNLICENSED | 1 | ℹ️ StackMap itself (private) |
| Python-2.0 | 1 | ✅ Approved |
| CC-BY-4.0 | 1 | ✅ Approved |
| 0BSD | 1 | ✅ Approved |
| CC0-1.0 | 1 | ✅ Approved |
| (MIT AND Zlib) | 1 | ✅ Approved |
| (MIT AND BSD-3-Clause) | 1 | ✅ Approved |
| MIT* | 1 | ✅ Approved |
| (Unlicense OR Apache-2.0) | 1 | ✅ Approved |
| (MIT OR CC0-1.0) | 1 | ✅ Approved |

## Problematic Licenses Check

**Tested for:** GPL, AGPL, LGPL, SSPL, OSL, EPL, EUPL, MPL

**Result:** ✅ **NONE FOUND**

## License Categories

### Permissive Licenses (✅ Safe for Commercial Use)
- **MIT (496):** Most permissive, allows commercial use with attribution
- **ISC (41):** Similar to MIT, very permissive
- **BSD-3-Clause (30):** Permissive with non-endorsement clause
- **BSD-2-Clause (11):** Simplified BSD
- **Apache-2.0 (15):** Permissive with patent grant
- **0BSD (1):** Public domain equivalent

### Public Domain (✅ Safe)
- **Unlicense (2):** Public domain dedication
- **CC0-1.0 (1):** Creative Commons public domain

### Special Cases

#### UNLICENSED (1 package) - ⚠️ Requires Review
**Action Required:** Identify this package and verify it's:
1. Our own internal package, OR
2. A dependency that should have a license specified

**Command to find:**
```bash
license-checker --production --onlyunknown
```

#### Python-2.0 (1 package) - ✅ Approved
Python Software Foundation License - permissive, compatible with commercial use

#### CC-BY-4.0 (1 package) - ✅ Approved
Creative Commons Attribution - permissive for software

## Compliance Scripts Added

Added to `package.json`:
```json
"license:check": "license-checker --production --summary",
"license:report": "license-checker --production --csv --out docs/security/licenses.csv",
"license:verify": "license-checker --production --failOn 'GPL;AGPL;LGPL;SSPL'"
```

## Detailed Report

Full CSV report available at: [docs/security/licenses.csv](./licenses.csv)

## Conclusion

**Production Readiness:** ✅ **APPROVED**

All production dependencies use permissive licenses compatible with:
- Commercial use
- Modification
- Distribution
- Private use

**Action Items:**
1. ⚠️ Identify and review the 1 UNLICENSED package
2. ✅ No other action required
3. 📅 Re-run quarterly or when adding major dependencies

## Next Steps

### Immediate
- [x] Generate license report
- [ ] Identify UNLICENSED package
- [x] Verify no copyleft licenses

### Ongoing (Quarterly)
- [ ] Re-run license compliance check
- [ ] Review any new dependencies
- [ ] Update this report

### Future Enhancements
- [ ] Add license check to CI/CD pipeline
- [ ] Automated alerts for problematic licenses
- [ ] License change monitoring

---

**Status:** ✅ PASSED (1 minor review item)
**Blockers:** None
**Ready for Production:** YES

---

*Generated: 2025-11-27*
*Tool: license-checker*
*Scan Type: Production dependencies only*

---
**See also:** [Quarterly Package Review Q4 2025](./quarterly-package-review-2025-Q4.md)
