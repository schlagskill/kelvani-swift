# Swift: Designanalyse und Neubau

Stand: 14.10.2026. 52 unterschiedliche Quellen wurden geöffnet und inhaltlich ausgewertet. Es handelt sich um Forschungsartikel, Standards, Designsystem-Dokumentation, KI-Veröffentlichungen und zwei Produktanleitungen; nicht um 52 unabhängige Studien. Nicht erreichbare Seiten und eine Seite ohne lesbaren Inhalt wurden nicht mitgezählt.

## Warum die vorige Oberfläche ordentlich, aber beliebig wirkte

Meine Bewertung von Swift, keine Nutzerstudie: Die Oberfläche hatte doppelte Navigation, mehrere ähnlich gewichtete Aktionen und großflächige Karten mit wenig Information. Unterschiedliche CSS-Schichten machten Abstände und Größen uneinheitlich. Viele kleine Umrandungen zerteilten den Inhalt. Das Ergebnis wirkte wie eine Sammlung von Komponenten statt wie ein Arbeitswerkzeug. Lila oder Inter allein sind keine Ursache für schlechte Qualität.

Die KI-spezifischen Quellen betonen Produktspezifik und konkrete Designabsicht. Die Grundlagenquellen liefern die Kriterien für Hierarchie, Erkennbarkeit und Konsistenz. Meine Schlussfolgerung: Weniger unabhängige Bausteine, mehr erkennbare Beziehungen zwischen Daten und Aktionen.

## Umsetzung in Swift 0.7.0

- Einmalige Navigation links; zentrale Suche oben.
- Arbeitsbereiche als kompakte Zeilen mit Namen, Website-Kontext, Tab-Anzahl und Datum.
- Neutrale Flächen mit gezielten lila Akzenten für Auswahl und Hauptaktionen.
- Eigenständige Vorlagenansicht; keine Vorlagenwerbung auf der Arbeitsübersicht.
- Hilfetexte auf Wunsch, Zusatzaktionen im Mehr-Menü.
- Browser-Favicons statt eines externen Icon-Dienstes.
- Klarer Fokus, Tastaturbedienung, Fehlerzustände und alternative Darstellung bei kleinen Fenstern.
- Neuer zusammenhängender Produktstil; Datenmodell und vorhandene Verwaltungsfunktionen bleiben erhalten.

## Quellen und daraus abgeleitete Regeln

1. [5 Principles of Visual Design in UX - NN/G](https://www.nngroup.com/articles/principles-visual-design/)
   Erkenntnis für Swift: Größe, Kontrast und Gruppierung müssen die Aufgabenhierarchie sichtbar machen.

2. [Visual Hierarchy in UX: Definition - NN/G](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)
   Erkenntnis für Swift: Nicht alle Überschriften, Flächen und Aktionen gleich stark hervorheben.

3. [Maintain Consistency and Adhere to Standards](https://www.nngroup.com/articles/consistency-and-standards/)
   Erkenntnis für Swift: Navigation und Begriffe stabil und konventionell halten.

4. [Aesthetic and Minimalist Design](https://www.nngroup.com/articles/aesthetic-minimalist-design/)
   Erkenntnis für Swift: Informationswert vor Dekoration; unnötige Wiederholungen entfernen.

5. [Cards: UI-Component Definition - NN/G](https://www.nngroup.com/articles/cards-component/)
   Erkenntnis für Swift: Karten nur für eigenständige Inhaltsobjekte, nicht als Standard für jede Information.

6. [Information Scent: How Users Decide Where to Go Next - NN/G](https://www.nngroup.com/articles/information-scent/)
   Erkenntnis für Swift: Beschriftungen müssen das Ziel einer Aktion erkennen lassen.

7. [The Aesthetic-Usability Effect - NN/G](https://www.nngroup.com/articles/aesthetic-usability-effect/)
   Erkenntnis für Swift: Optische Qualität und tatsächliche Bedienbarkeit getrennt überprüfen.

8. [Progressive Disclosure - NN/G](https://www.nngroup.com/articles/progressive-disclosure/)
   Erkenntnis für Swift: Seltene Aktionen erst bei Bedarf zeigen.

9. [Memory Recognition and Recall in User Interfaces - NN/G](https://www.nngroup.com/articles/recognition-and-recall/)
   Erkenntnis für Swift: Website-Icons, Namen und Kontext helfen beim Wiedererkennen.

10. [Visibility of System Status - NN/G](https://www.nngroup.com/articles/visibility-system-status/)
   Erkenntnis für Swift: Auswahl, Sicherung und Fehler klar kommunizieren.

11. [Flat UI Elements Attract Less Attention and Cause Uncertainty - NN/G](https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/)
   Erkenntnis für Swift: Klickbare Bereiche brauchen erkennbare Zustände und Signale.

12. [Icon Usability - NN/G](https://www.nngroup.com/articles/icon-usability/)
   Erkenntnis für Swift: Icons ergänzen klare Beschriftungen, sie ersetzen diese nicht pauschal.

13. [Designing Empty States in Complex Applications: 3 Guidelines - NN/G](https://www.nngroup.com/articles/empty-state-interface-design/)
   Erkenntnis für Swift: Leere Zustände brauchen einen direkten nächsten Schritt.

14. [Tabs, Used Right - NN/G](https://www.nngroup.com/articles/tabs-used-right/)
   Erkenntnis für Swift: Ansichten und Inhalte nachvollziehbar gliedern; keine doppelte Navigation.

15. [Menu-Design Checklist: 17 UX Guidelines - NN/G](https://www.nngroup.com/articles/menu-design/)
   Erkenntnis für Swift: Navigation sichtbar, verständlich und am gleichen Ort halten.

16. [Spacing – GOV.UK Design System](https://design-system.service.gov.uk/styles/spacing/)
   Erkenntnis für Swift: Wenige definierte Abstände statt beliebiger Einzelwerte.

17. [Layout – GOV.UK Design System](https://design-system.service.gov.uk/styles/layout/)
   Erkenntnis für Swift: Abstände vermitteln Beziehungen; schmale Fenster müssen funktionieren.

18. [Colour – GOV.UK Design System](https://design-system.service.gov.uk/styles/colour/)
   Erkenntnis für Swift: Farben nach ihrer Funktion einsetzen, Lesbarkeit prüfen.

19. [Understanding Success Criterion 1.4.3: Contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
   Erkenntnis für Swift: Textkontrast muss ausreichend sein; Dezentheit darf Lesbarkeit nicht kosten.

20. [Understanding Success Criterion 1.4.11: Non-text Contrast | WAI | W3C](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
   Erkenntnis für Swift: Fokus und relevante Kontrollzustände brauchen erkennbaren Kontrast.

21. [Understanding Success Criterion 2.1.1: Keyboard | WAI | W3C](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)
   Erkenntnis für Swift: Aktionen bleiben auch ohne Maus erreichbar.

22. [Understanding Success Criterion 2.4.7: Focus Visible | WAI | W3C](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
   Erkenntnis für Swift: Tastaturfokus immer sichtbar gestalten.

23. [Understanding Success Criterion 2.4.11: Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
   Erkenntnis für Swift: Fokussierte Kontrollen dürfen nicht durch feste Flächen verdeckt werden.

24. [Understanding Success Criterion 2.4.6: Headings and Labels | WAI | W3C](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html)
   Erkenntnis für Swift: Überschriften und Labels benennen Zweck und Inhalt.

25. [Understanding Success Criterion 2.5.8: Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
   Erkenntnis für Swift: Klickziele ausreichend groß oder ausreichend getrennt gestalten.

26. [Understanding Success Criterion 1.4.10: Reflow | WAI | W3C](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
   Erkenntnis für Swift: Inhalte dürfen bei kleinen Fenstern nicht unbedienbar werden.

27. [Understanding Success Criterion 3.2.3: Consistent Navigation | WAI | W3C](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html)
   Erkenntnis für Swift: Navigation wiederholt sich in stabiler Reihenfolge.

28. [Understanding Success Criterion 1.3.1: Info and Relationships | WAI | W3C](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)
   Erkenntnis für Swift: Die visuelle Gliederung muss auch im HTML verständlich sein.

29. [Understanding Success Criterion 4.1.3: Status Messages | WAI | W3C](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
   Erkenntnis für Swift: Statusmeldungen ohne Fokuswechsel für Hilfstechnologien zugänglich machen.

30. [Understanding Success Criterion 1.4.1: Use of Color | WAI | W3C](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
   Erkenntnis für Swift: Zustände nicht ausschließlich durch Farbe unterscheiden.

31. [Typography - Fluent 2 Design System](https://fluent2.microsoft.design/typography)
   Erkenntnis für Swift: Schriftgröße, Gewicht und Zeilenhöhe nach Inhaltsrollen wählen.

32. [Color - Fluent 2 Design System](https://fluent2.microsoft.design/color)
   Erkenntnis für Swift: Neutrale Flächen, Markenfarbe und Zustandsfarben voneinander trennen.

33. [Layout - Fluent 2 Design System](https://fluent2.microsoft.design/layout)
   Erkenntnis für Swift: Abstände vermitteln Beziehungen; schmale Fenster müssen funktionieren.

34. [Iconography - Fluent 2 Design System](https://fluent2.microsoft.design/iconography)
   Erkenntnis für Swift: Einheitliche Icons mit semantischer Funktion verwenden.

35. [Motion - Fluent 2 Design System](https://fluent2.microsoft.design/motion)
   Erkenntnis für Swift: Bewegung erklärt Veränderungen; dauernde dekorative Bewegung vermeiden.

36. [React Nav - Fluent 2 Design System](https://fluent2.microsoft.design/components/web/react/core/nav/usage)
   Erkenntnis für Swift: Hauptnavigation soll eine verständliche, überschaubare Struktur abbilden.

37. [Generative UI and Outcome-Oriented Design - NN/G](https://www.nngroup.com/articles/generative-ui/)
   Erkenntnis für Swift: Nutzerziele und Einschränkungen vor einzelnen UI-Bausteinen definieren.

38. [UX-Context Design: Using UX Knowledge to Inform AI-Generated Design - NN/G](https://www.nngroup.com/articles/ux-context-design/)
   Erkenntnis für Swift: KI braucht Produktspezifik, Aufgaben und klare Designregeln statt vager Stilwörter.

39. [Using AI for UX Work: Study Guide - NN/G](https://www.nngroup.com/articles/ai-work-study-guide/)
   Erkenntnis für Swift: KI-Ergebnisse kritisch prüfen und gezielt überarbeiten.

40. [Frontend Design | Claude by Anthropic](https://claude.com/plugins/frontend-design)
   Erkenntnis für Swift: Eine bewusste Gestaltungsrichtung vor dem Codieren festlegen; Markenfarbe nicht pauschal verwerfen.

41. [[2406.13631] On AI-Inspired UI-Design](https://arxiv.org/abs/2406.13631)
   Erkenntnis für Swift: KI kann unterschiedliche Entwurfswege unterstützen; die Auswahl bleibt eine Designentscheidung.

42. [[2601.19171] Bridging Gulfs in UI Generation through Semantic Guidance](https://arxiv.org/abs/2601.19171)
   Erkenntnis für Swift: Designabsicht und Beziehungen zwischen Elementen konkret formulieren.

43. [Tab Manager | Workona Help Center](https://workona.com/help/tab-manager/)
   Erkenntnis für Swift: Arbeitsbereiche und offene Tabs müssen als unterschiedliche Aufgaben verständlich sein.

44. [Tabme Guide & FAQ: How to use Tabme](https://gettabme.com/guide.html)
   Erkenntnis für Swift: Sichern, Ordnen und Wiederfinden als klare Arbeitsabläufe anbieten.

45. [Typeface – GOV.UK Design System](https://design-system.service.gov.uk/styles/typeface/)
   Erkenntnis für Swift: Typografie gehört zur Produktidentität und muss konsistent bleiben.

46. [Type scale – GOV.UK Design System](https://design-system.service.gov.uk/styles/type-scale/)
   Erkenntnis für Swift: Eine begrenzte Schriftgrößenskala schafft einen nachvollziehbaren Rhythmus.

47. [Button – GOV.UK Design System](https://design-system.service.gov.uk/components/button/)
   Erkenntnis für Swift: Aktionsbezeichnungen beschreiben das Ergebnis.

48. [Table – GOV.UK Design System](https://design-system.service.gov.uk/components/table/)
   Erkenntnis für Swift: Gleichartige Informationen in vergleichbaren Spalten darstellen.

49. [Details – GOV.UK Design System](https://design-system.service.gov.uk/components/details/)
   Erkenntnis für Swift: Weiterführende Informationen erst auf Wunsch anzeigen.

50. [Tabs – GOV.UK Design System](https://design-system.service.gov.uk/components/tabs/)
   Erkenntnis für Swift: Verwandte Inhalte getrennt, mit einer klaren aktiven Ansicht.

51. [Error summary – GOV.UK Design System](https://design-system.service.gov.uk/components/error-summary/)
   Erkenntnis für Swift: Fehler verständlich beschreiben und bei der betroffenen Aktion zeigen.

52. [Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
   Erkenntnis für Swift: Dialoge brauchen Fokusführung, sichtbare Schließen-Aktion und Escape-Unterstützung.
