from dataclasses import dataclass


@dataclass(slots=True)
class ConnectorSpec:
    name: str
    purpose: str
    input_contract: str
    output_contract: str
