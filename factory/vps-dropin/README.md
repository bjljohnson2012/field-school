# VPS drop-in

On Field School VPS `2.24.70.248` only:

```
cp factory/fieldschool_adapter/edit_spec.py \
   factory/fieldschool_adapter/quality_gate.py \
   factory/fieldschool_adapter/status_machine.py \
   /opt/fieldschool-adapter/fieldschool_adapter/
```

Then wire `after_review_write_spec` at the end of `pipeline.process_one` after Status becomes Review, and replace the Review→Cleaning block in `processor.kick_asset` with `maybe_flip_cleaning`.

Do not copy these files to CNC vault `2.24.64.248`.
Do not `/trigger` Asset Just `27pn9xs0zk8a73g`.
Do not flip Published or Distributed.
