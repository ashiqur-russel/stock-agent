from services.release_notes import (
    preview_notes_for_version,
    semver_gt,
    semver_tuple,
    should_show_whats_new,
)


def test_semver_tuple() -> None:
    assert semver_tuple("1.2.3") == (1, 2, 3)
    assert semver_tuple("v0.2.0") == (0, 2, 0)


def test_semver_gt() -> None:
    assert semver_gt("0.2.1", "0.2.0")
    assert not semver_gt("0.2.0", "0.2.0")
    assert not semver_gt("0.2.0", "0.3.0")
    assert semver_gt("1.0.0", None)


def test_should_show_whats_new() -> None:
    assert not should_show_whats_new("9.9.9", None, None)  # no notes file entry
    assert should_show_whats_new("0.2.0", None, None)
    assert not should_show_whats_new("0.2.0", "0.2.0", None)


def test_preview_notes_for_version() -> None:
    p = preview_notes_for_version("0.2.0", lang="en")
    assert p is not None
    assert "title" in p and p["title"]
    assert isinstance(p["features_teaser"], list)
    assert p["has_more"] is True
    assert preview_notes_for_version("9.9.9", lang="en") is None
