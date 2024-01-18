import datetime
from contextlib import contextmanager

import packaging.version
import pendulum
from typing_extensions import TypeAlias

_IS_PENDULUM_1 = (
    hasattr(pendulum, "__version__")
    and getattr(packaging.version.parse(getattr(pendulum, "__version__")), "major") == 1
)

_IS_PENDULUM_3 = (
    hasattr(pendulum, "__version__")
    and getattr(packaging.version.parse(getattr(pendulum, "__version__")), "major") == 3
)

POST_TRANSITION = pendulum.tz.POST_TRANSITION if _IS_PENDULUM_3 else pendulum.POST_TRANSITION
PRE_TRANSITION = pendulum.tz.PRE_TRANSITION if _IS_PENDULUM_3 else pendulum.PRE_TRANSITION
TRANSITION_ERROR = pendulum.tz.TRANSITION_ERROR if _IS_PENDULUM_3 else pendulum.TRANSITION_ERROR


def pendulum_create_timezone(tz_name: str):
    if _IS_PENDULUM_3:
        from pendulum.tz.timezone import Timezone

        return Timezone(tz_name)
    else:
        return pendulum.tz.timezone(tz_name)  # type: ignore


@contextmanager
def mock_pendulum_timezone(override_timezone):
    if _IS_PENDULUM_1:
        with pendulum.tz.LocalTimezone.test(pendulum.Timezone.load(override_timezone)):
            yield
    else:
        with pendulum.tz.test_local_timezone(pendulum.tz.timezone(override_timezone)):
            yield


def create_pendulum_time(year, month, day, *args, **kwargs):
    if "tz" in kwargs and "dst_rule" in kwargs and _IS_PENDULUM_1:
        tz = pendulum.timezone(kwargs.pop("tz"))
        dst_rule = kwargs.pop("dst_rule")

        return pendulum.instance(
            tz.convert(
                datetime.datetime(
                    year,
                    month,
                    day,
                    *args,
                    **kwargs,
                ),
                dst_rule=dst_rule,
            )
        )

    if "dst_rule" in kwargs and _IS_PENDULUM_3:
        dst_rule = kwargs.pop("dst_rule")
        if dst_rule == PRE_TRANSITION:
            kwargs["fold"] = 0
        elif dst_rule == POST_TRANSITION:
            kwargs["fold"] = 1
        elif dst_rule == TRANSITION_ERROR:
            tz_name = kwargs.pop("tz")
            assert tz_name
            return pendulum.instance(
                pendulum_create_timezone(tz_name).convert(
                    datetime.datetime(
                        year,
                        month,
                        day,
                        *args,
                        **kwargs,
                    ),
                    raise_on_unknown_times=True,
                )
            )

    return (
        pendulum.create(year, month, day, *args, **kwargs)
        if _IS_PENDULUM_1
        else pendulum.datetime(year, month, day, *args, **kwargs)
    )


PendulumDateTime: TypeAlias = (
    pendulum.Pendulum if _IS_PENDULUM_1 else pendulum.DateTime  # type: ignore[attr-defined]
)

PendulumInterval: TypeAlias = (
    pendulum.Interval if _IS_PENDULUM_3 else pendulum.Period  # type: ignore[attr-defined]
)


@contextmanager
def pendulum_freeze_time(t):
    if _IS_PENDULUM_3:
        yield from pendulum.travel_to(t, freeze=True)
    else:
        yield from pendulum.time(t)


# Workaround for issue with .in_tz() in pendulum:
# https://github.com/sdispater/pendulum/issues/535
def to_timezone(dt: PendulumDateTime, tz: str):
    timestamp = dt.timestamp()
    # handle negative timestamps, which are not natively supported on Windows
    if timestamp < 0:
        return pendulum.from_timestamp(0, tz=tz) + datetime.timedelta(seconds=timestamp)
    return pendulum.from_timestamp(dt.timestamp(), tz=tz)
