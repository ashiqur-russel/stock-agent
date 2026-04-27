from services.release_notes import semver_gt, semver_tuple, should_show_whats_new


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
