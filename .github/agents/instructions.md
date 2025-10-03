# Copilot Agent Instructions

## Project Status

This application is in **early development phase**. The priority is to keep the codebase clean, simple, and maintainable rather than maintaining backwards compatibility.

## Development Guidelines

### Code Quality Over Compatibility
- **Favor simplicity and clarity** over backwards compatibility
- Make code changes that are clean and easy to understand
- Refactor freely to improve code structure
- Don't be constrained by existing implementations if they can be improved

### Transparency and Honesty
- **If something is impossible to implement**, clearly state this in the pull request comment
- Do not attempt workarounds or hacks that compromise code quality
- Be explicit about limitations, trade-offs, and technical constraints
- Suggest alternative approaches when the requested implementation is problematic

### No Dummy or Empty Functions
- **Never create dummy, stub, or empty functions** unless explicitly requested by the user
- Implement complete, functional code that actually works
- If a feature cannot be fully implemented, discuss this with the user first
- Partial implementations should be clearly documented with TODOs and explanations

### Testing Requirements
- **Add unit tests** for new functionalities where appropriate
- **Add integration tests** for features that involve multiple components
- Ensure tests are meaningful and actually validate the functionality
- Follow the existing test patterns in the `test/` directory
- Use Mocha and Chai as the testing framework (already in use)

### Context and Documentation
- **Always reference `specification.md`** to understand user-facing functionalities
- **Always reference `architecture.md`** to understand technical decisions and standards
- Update both files when adding new features or making architectural changes
- Keep documentation synchronized with code changes

## File Structure for Context

- **`specification.md`** - Documents all user-facing functionalities and features
- **`architecture.md`** - Documents architectural decisions, technical standards, and design patterns

Always consult these files before implementing changes to ensure consistency with project goals and existing patterns.

## Communication Style

- Be clear and direct about what can and cannot be done
- Provide reasoning for technical decisions
- Ask for clarification when requirements are ambiguous
- Document assumptions made during implementation
