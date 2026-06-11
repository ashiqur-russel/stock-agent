"""Regression tests for cost-basis / P&L math in portfolio_service."""

import pytest

from services.portfolio_service import (
    OversellError,
    _calculate_holdings,
    validate_transaction_sequence,
)


def _tx(ticker, tx_type, shares, price, executed_at, created_at="2024-01-01T00:00:00"):
    return {
        "ticker": ticker,
        "type": tx_type,
        "shares": shares,
        "price": price,
        "executed_at": executed_at,
        "created_at": created_at,
    }


class TestCalculateHoldings:
    def test_single_buy(self):
        h = _calculate_holdings([_tx("AAPL", "BUY", 10, 100.0, "2024-01-01")])
        assert h["AAPL"]["shares_held"] == 10
        assert h["AAPL"]["avg_cost"] == 100.0
        assert h["AAPL"]["realized_pnl"] == 0.0

    def test_average_cost_over_multiple_buys(self):
        h = _calculate_holdings(
            [
                _tx("AAPL", "BUY", 10, 100.0, "2024-01-01"),
                _tx("AAPL", "BUY", 10, 200.0, "2024-01-02"),
            ]
        )
        assert h["AAPL"]["shares_held"] == 20
        assert h["AAPL"]["avg_cost"] == pytest.approx(150.0)

    def test_partial_sell_realizes_pnl_at_avg_cost(self):
        h = _calculate_holdings(
            [
                _tx("AAPL", "BUY", 10, 100.0, "2024-01-01"),
                _tx("AAPL", "SELL", 4, 150.0, "2024-01-02"),
            ]
        )
        assert h["AAPL"]["shares_held"] == 6
        assert h["AAPL"]["avg_cost"] == pytest.approx(100.0)
        assert h["AAPL"]["realized_pnl"] == pytest.approx(4 * 50.0)

    def test_full_sell_removes_holding(self):
        h = _calculate_holdings(
            [
                _tx("AAPL", "BUY", 10, 100.0, "2024-01-01"),
                _tx("AAPL", "SELL", 10, 150.0, "2024-01-02"),
            ]
        )
        assert "AAPL" not in h

    def test_legacy_oversell_does_not_fabricate_pnl(self):
        # Bad historical row selling more than held: only the held shares
        # may contribute to realized P&L.
        h = _calculate_holdings(
            [
                _tx("AAPL", "BUY", 5, 100.0, "2024-01-01"),
                _tx("AAPL", "SELL", 50, 200.0, "2024-01-02"),
                _tx("AAPL", "BUY", 10, 80.0, "2024-01-03"),
            ]
        )
        # Realized P&L counts only the 5 shares actually held.
        assert h["AAPL"]["shares_held"] == 10
        assert h["AAPL"]["avg_cost"] == pytest.approx(80.0)
        assert h["AAPL"]["realized_pnl"] == pytest.approx(5 * 100.0)

    def test_rebuy_after_full_sell_resets_cost_basis(self):
        h = _calculate_holdings(
            [
                _tx("AAPL", "BUY", 10, 100.0, "2024-01-01"),
                _tx("AAPL", "SELL", 10, 150.0, "2024-01-02"),
                _tx("AAPL", "BUY", 5, 300.0, "2024-01-03"),
            ]
        )
        assert h["AAPL"]["shares_held"] == 5
        assert h["AAPL"]["avg_cost"] == pytest.approx(300.0)


class TestValidateTransactionSequence:
    def test_valid_sequence_passes(self):
        validate_transaction_sequence(
            [
                _tx("AAPL", "BUY", 10, 100.0, "2024-01-01"),
                _tx("AAPL", "SELL", 10, 150.0, "2024-01-02"),
            ]
        )

    def test_oversell_rejected(self):
        with pytest.raises(OversellError):
            validate_transaction_sequence(
                [
                    _tx("AAPL", "BUY", 5, 100.0, "2024-01-01"),
                    _tx("AAPL", "SELL", 6, 150.0, "2024-01-02"),
                ]
            )

    def test_sell_before_buy_rejected(self):
        with pytest.raises(OversellError):
            validate_transaction_sequence(
                [
                    _tx("AAPL", "SELL", 1, 150.0, "2024-01-01"),
                    _tx("AAPL", "BUY", 5, 100.0, "2024-01-02"),
                ]
            )

    def test_validation_replays_in_execution_order(self):
        # Entered out of order but executes BUY-first — must pass.
        validate_transaction_sequence(
            [
                _tx("AAPL", "SELL", 5, 150.0, "2024-02-01"),
                _tx("AAPL", "BUY", 5, 100.0, "2024-01-01"),
            ]
        )

    def test_fractional_shares_within_epsilon(self):
        # 0.1 + 0.2 != 0.3 in floats; epsilon must absorb that.
        validate_transaction_sequence(
            [
                _tx("AAPL", "BUY", 0.1, 100.0, "2024-01-01"),
                _tx("AAPL", "BUY", 0.2, 100.0, "2024-01-02"),
                _tx("AAPL", "SELL", 0.3, 150.0, "2024-01-03"),
            ]
        )

    def test_tickers_are_independent(self):
        with pytest.raises(OversellError):
            validate_transaction_sequence(
                [
                    _tx("AAPL", "BUY", 10, 100.0, "2024-01-01"),
                    _tx("MSFT", "SELL", 1, 150.0, "2024-01-02"),
                ]
            )
